'use strict';

const postcss = require('postcss');
const selectorParser = require('postcss-selector-parser');
const valueParser = require('postcss-value-parser');

const IS_GLOBAL = Symbol('is global');

function normalizeNodeArray(nodes) {
  const array = [];

  nodes.forEach(function(x) {
    if (Array.isArray(x)) {
      normalizeNodeArray(x).forEach(function(item) {
        array.push(item);
      });
    } else if (x) {
      array.push(x);
    }
  });

  if (array.length > 0 && array[array.length - 1].type === 'spacing') {
    array.pop();
  }
  return array;
}

function checkForInconsistentRule(node, current, context) {
  if (context.isGlobal !== context.lastIsGlobal)
    throw new Error(
      'Inconsistent rule global/local result in rule "' +
        String(node) +
        '" (multiple selectors must result in the same mode for the rule)'
    );
}

function trimSelectors(selector) {
  let last;
  while (
    (last = selector.last) &&
    (last.type === 'combinator' && last.value === ' ')
  ) {
    last.remove();
  }
}

function localizeNodez(rule, mode, options) {
  console.log(mode);
  const isScopePseudo = node =>
    node.value === ':local' || node.value === ':global';

  const transform = (node, context) => {
    switch (node.type) {
      case 'root': {
        const childContext = { ...context, hasLocals: false };
        let overallIsGlobal;

        node.each(childNode => {
          // isGlobal should not carry over across selectors:
          // `:global .foo, .bar -> .foo, :local(.bar)`
          childContext.isGlobal = context.isGlobal;

          transform(childNode, childContext);

          if (overallIsGlobal == null) {
            overallIsGlobal = childContext.isGlobal;
          } else {
            if (overallIsGlobal !== childContext.isGlobal)
              throw new Error(
                'Inconsistent rule global/local result in rule "' +
                  String(node) +
                  '" (multiple selectors must result in the same mode for the rule)'
              );
          }
          console.log(childContext.hasLocals);
          if (childContext.hasLocals) {
            context.hasPureGlobals = false;
          }
        });

        break;
      }
      case 'selector': {
        // const childContext = { ...context, hasLocals: false };

        node.each(childNode => transform(childNode, context));

        // context.isGlobal = childContext.isGlobal;

        trimSelectors(node);

        break;
      }
      case 'combinator': {
        if (
          node.value === ' ' &&
          (context.shouldTrimTrainingWhitespace || !node.next())
        ) {
          //console.log('COMBIN', node.spaces);
          context.shouldTrimTrainingWhitespace = false;
          node.remove();
        }
        break;
      }
      case 'pseudo': {
        if (!isScopePseudo(node)) {
          // const childContext = {
          //   ...context,
          //   hasLocals: false,
          // };
          node.each(childNode => transform(childNode, context));

          // if (childContext.hasLocals) context.hasLocals = true;
          break;
        }

        if (context.inside) {
          throw new Error(
            `A ${node.value} is not allowed inside of a ${context.inside}(...)`
          );
        }

        const isGlobal = node.value === ':global';

        const isNested = !!node.length;
        if (!isNested) {
          context.isGlobal = isGlobal;
          context.shouldTrimTrainingWhitespace = !node.spaces.before;
          // console.log(node.spaces);
          node.remove();
          return null;
        }

        const childContext = {
          ...context,
          isGlobal,
          inside: node.value,
          hasLocals: false,
        };

        // The nodes of a psuedo will be Selectors, which we want to flatten
        // into the parent
        const nodes = node
          .clone()
          .map(childNode => transform(childNode, childContext))
          .reduce(
            (acc, next) =>
              acc.concat(next.type === 'selector' ? next.nodes : next),
            []
          );

        // console.log('asfasfasf', nodes);

        if (nodes.length) {
          const { before, after } = node.spaces;

          const first = nodes[0];
          const last = nodes[node.length - 1];

          first.spaces = { before, after: first.spaces.after };
          last.spaces = { before: last.spaces.before, after };
        }
        nodes.forEach(childNode => {
          node.parent.insertBefore(node, childNode);
        });
        node.remove();
        // const parent = node.parent;
        // node.replaceWith(nodes[0].nodes);
        // console.log('asfasfasf', nodes, String(parent.parent));
        return nodes;
      }
      case 'id':
      case 'class': {
        const spaces = { ...node.spaces };

        if (context.shouldTrimTrainingWhitespace) {
          // console.log('HEREEEEEE', spaces);
          spaces.before = '';
          context.shouldTrimTrainingWhitespace = false;
        }

        if (!context.isGlobal) {
          // console.log('REPLCE', node.spaces);
          const innerNode = node.clone();
          innerNode.spaces = { before: '', after: '' };

          // console.log(node);
          node.replaceWith(
            selectorParser.pseudo({
              value: ':local',
              nodes: [innerNode],
              spaces,
            })
          );
          console.log('HERE');
          context.hasLocals = true;
        } else {
          //node.spaces = spaces;
        }
        break;
      }
    }
    return node;
  };

  const isGlobal = mode === 'global';
  const rootContext = {
    isGlobal,
    hasPureGlobals: true,
  };

  const updatedRule = selectorParser(root => {
    transform(root, rootContext);
  }).processSync(rule, { updateSelector: true, lossless: true });

  // console.log('HERE', rule.selector);
  return rootContext;
}

function localizeDeclNode(node, context) {
  switch (node.type) {
    case 'word':
      if (context.localizeNextItem) {
        node.value = ':local(' + node.value + ')';
        context.localizeNextItem = false;
      }
      break;

    case 'function':
      if (
        context.options &&
        context.options.rewriteUrl &&
        node.value.toLowerCase() === 'url'
      ) {
        node.nodes.map(nestedNode => {
          if (nestedNode.type !== 'string' && nestedNode.type !== 'word') {
            return;
          }

          let newUrl = context.options.rewriteUrl(
            context.isGlobal,
            nestedNode.value
          );

          switch (nestedNode.type) {
            case 'string':
              if (nestedNode.quote === "'") {
                newUrl = newUrl.replace(/(\\)/g, '\\$1').replace(/'/g, "\\'");
              }

              if (nestedNode.quote === '"') {
                newUrl = newUrl.replace(/(\\)/g, '\\$1').replace(/"/g, '\\"');
              }

              break;
            case 'word':
              newUrl = newUrl.replace(/("|'|\)|\\)/g, '\\$1');
              break;
          }

          nestedNode.value = newUrl;
        });
      }
      break;
  }
  return node;
}

function isWordAFunctionArgument(wordNode, functionNode) {
  return functionNode
    ? functionNode.nodes.some(
        functionNodeChild =>
          functionNodeChild.sourceIndex === wordNode.sourceIndex
      )
    : false;
}

function localizeAnimationShorthandDeclValues(decl, context) {
  const validIdent = /^-?[_a-z][_a-z0-9-]*$/i;

  /*
  The spec defines some keywords that you can use to describe properties such as the timing
  function. These are still valid animation names, so as long as there is a property that accepts
  a keyword, it is given priority. Only when all the properties that can take a keyword are
  exhausted can the animation name be set to the keyword. I.e.

  animation: infinite infinite;

  The animation will repeat an infinite number of times from the first argument, and will have an
  animation name of infinite from the second.
  */
  const animationKeywords = {
    $alternate: 1,
    '$alternate-reverse': 1,
    $backwards: 1,
    $both: 1,
    $ease: 1,
    '$ease-in': 1,
    '$ease-in-out': 1,
    '$ease-out': 1,
    $forwards: 1,
    $infinite: 1,
    $linear: 1,
    $none: Infinity, // No matter how many times you write none, it will never be an animation name
    $normal: 1,
    $paused: 1,
    $reverse: 1,
    $running: 1,
    '$step-end': 1,
    '$step-start': 1,
    $initial: Infinity,
    $inherit: Infinity,
    $unset: Infinity,
  };

  const didParseAnimationName = false;
  let parsedAnimationKeywords = {};
  let stepsFunctionNode = null;
  const valueNodes = valueParser(decl.value).walk(node => {
    /* If div-token appeared (represents as comma ','), a possibility of an animation-keywords should be reflesh. */
    if (node.type === 'div') {
      parsedAnimationKeywords = {};
    }
    if (node.type === 'function' && node.value.toLowerCase() === 'steps') {
      stepsFunctionNode = node;
    }
    const value =
      node.type === 'word' && !isWordAFunctionArgument(node, stepsFunctionNode)
        ? node.value.toLowerCase()
        : null;

    let shouldParseAnimationName = false;

    if (!didParseAnimationName && value && validIdent.test(value)) {
      if ('$' + value in animationKeywords) {
        parsedAnimationKeywords['$' + value] =
          '$' + value in parsedAnimationKeywords
            ? parsedAnimationKeywords['$' + value] + 1
            : 0;

        shouldParseAnimationName =
          parsedAnimationKeywords['$' + value] >=
          animationKeywords['$' + value];
      } else {
        shouldParseAnimationName = true;
      }
    }

    const subContext = {
      options: context.options,
      isGlobal: context.isGlobal,
      localizeNextItem: shouldParseAnimationName && !context.isGlobal,
    };
    return localizeDeclNode(node, subContext);
  });

  decl.value = valueNodes.toString();
}

function localizeDeclValues(localize, decl, context) {
  const valueNodes = valueParser(decl.value);
  valueNodes.walk((node, index, nodes) => {
    const subContext = {
      options: context.options,
      isGlobal: context.isGlobal,
      localizeNextItem: localize && !context.isGlobal,
    };
    nodes[index] = localizeDeclNode(node, subContext);
  });
  decl.value = valueNodes.toString();
}

function localizeDecl(decl, context) {
  const isAnimation = /animation$/i.test(decl.prop);

  if (isAnimation) {
    return localizeAnimationShorthandDeclValues(decl, context);
  }

  const isAnimationName = /animation(-name)?$/i.test(decl.prop);

  if (isAnimationName) {
    return localizeDeclValues(true, decl, context);
  }

  const hasUrl = /url\(/i.test(decl.value);

  if (hasUrl) {
    return localizeDeclValues(false, decl, context);
  }
}

module.exports = postcss.plugin('postcss-modules-local-by-default', function(
  options
) {
  if (typeof options !== 'object') {
    options = {}; // If options is undefined or not an object the plugin fails
  }
  if (options && options.mode) {
    if (
      options.mode !== 'global' &&
      options.mode !== 'local' &&
      options.mode !== 'pure'
    ) {
      throw new Error(
        'options.mode must be either "global", "local" or "pure" (default "local")'
      );
    }
  }
  const pureMode = options && options.mode === 'pure';
  const globalMode = options && options.mode === 'global';
  return function(css) {
    css.walkAtRules(function(atrule) {
      if (/keyframes$/i.test(atrule.name)) {
        const globalMatch = /^\s*:global\s*\((.+)\)\s*$/.exec(atrule.params);
        const localMatch = /^\s*:local\s*\((.+)\)\s*$/.exec(atrule.params);
        let globalKeyframes = globalMode;
        if (globalMatch) {
          if (pureMode) {
            throw atrule.error(
              '@keyframes :global(...) is not allowed in pure mode'
            );
          }
          atrule.params = globalMatch[1];
          globalKeyframes = true;
        } else if (localMatch) {
          atrule.params = localMatch[0];
          globalKeyframes = false;
        } else if (!globalMode) {
          atrule.params = ':local(' + atrule.params + ')';
        }
        atrule.walkDecls(function(decl) {
          localizeDecl(decl, {
            options: options,
            isGlobal: globalKeyframes,
          });
        });
      } else if (atrule.nodes) {
        atrule.nodes.forEach(function(decl) {
          if (decl.type === 'decl') {
            localizeDecl(decl, {
              options: options,
              isGlobal: globalMode,
            });
          }
        });
      }
    });
    css.walkRules(function(rule) {
      if (
        rule.parent.type === 'atrule' &&
        /keyframes$/i.test(rule.parent.name)
      ) {
        // ignore keyframe rules
        return;
      }

      const context = localizeNodez(rule, options.mode, options);

      if (pureMode && context.hasPureGlobals) {
        throw rule.error(
          'Selector "' +
            rule.selector +
            '" is not pure ' +
            '(pure selectors must contain at least one local class or id)'
        );
      }
      // Less-syntax mixins parse as rules with no nodes
      if (rule.nodes) {
        rule.nodes.forEach(function(decl) {
          console.log(context);
          localizeDecl(decl, context);
        });
      }
    });
  };
});
