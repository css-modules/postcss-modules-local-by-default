"use strict";

const postcss = require("postcss");
const plugin = require("../src");
const name = require("../package.json").name;

const tests = [
  {
    name: "scope selectors",
    input: ".foobar {}",
    expected: ":local(.foobar) {}",
  },
  {
    name: "scope escaped selectors",
    input: ".\\3A \\) {}",
    expected: ":local(.\\3A \\)) {}",
  },
  {
    name: "scope ids",
    input: "#foobar {}",
    expected: ":local(#foobar) {}",
  },
  {
    name: "scope escaped ids",
    input: "#\\#test {}",
    expected: ":local(#\\#test) {}",
  },
  {
    name: "scope escaped ids (2)",
    input: "#u-m\\00002b {}",
    expected: ":local(#u-m\\00002b) {}",
  },
  {
    name: "scope multiple selectors",
    input: ".foo, .baz {}",
    expected: ":local(.foo), :local(.baz) {}",
  },
  {
    name: "scope sibling selectors",
    input: ".foo ~ .baz {}",
    expected: ":local(.foo) ~ :local(.baz) {}",
  },
  {
    name: "scope psuedo elements",
    input: ".foo:after {}",
    expected: ":local(.foo):after {}",
  },
  {
    name: "scope media queries",
    input: "@media only screen { .foo {} }",
    expected: "@media only screen { :local(.foo) {} }",
  },
  {
    name: "allow narrow global selectors",
    input: ":global(.foo .bar) {}",
    expected: ".foo .bar {}",
  },
  {
    name: "allow narrow local selectors",
    input: ":local(.foo .bar) {}",
    expected: ":local(.foo) :local(.bar) {}",
  },
  {
    name: "allow broad global selectors",
    input: ":global .foo .bar {}",
    expected: ".foo .bar {}",
  },
  {
    name: "allow broad local selectors",
    input: ":local .foo .bar {}",
    expected: ":local(.foo) :local(.bar) {}",
  },
  {
    name: "allow multiple narrow global selectors",
    input: ":global(.foo), :global(.bar) {}",
    expected: ".foo, .bar {}",
  },
  {
    name: "allow multiple broad global selectors",
    input: ":global .foo, :global .bar {}",
    expected: ".foo, .bar {}",
  },
  {
    name: "allow multiple broad local selectors",
    input: ":local .foo, :local .bar {}",
    expected: ":local(.foo), :local(.bar) {}",
  },
  {
    name: "allow narrow global selectors nested inside local styles",
    input: ".foo :global(.foo .bar) {}",
    expected: ":local(.foo) .foo .bar {}",
  },
  {
    name: "allow broad global selectors nested inside local styles",
    input: ".foo :global .foo .bar {}",
    expected: ":local(.foo) .foo .bar {}",
  },
  {
    name: "allow parentheses inside narrow global selectors",
    input: ".foo :global(.foo:not(.bar)) {}",
    expected: ":local(.foo) .foo:not(.bar) {}",
  },
  {
    name: "allow parentheses inside narrow local selectors",
    input: ".foo :local(.foo:not(.bar)) {}",
    expected: ":local(.foo) :local(.foo):not(:local(.bar)) {}",
  },
  {
    name: "allow narrow global selectors appended to local styles",
    input: ".foo:global(.foo.bar) {}",
    expected: ":local(.foo).foo.bar {}",
  },
  {
    name: "ignore selectors that are already local",
    input: ":local(.foobar) {}",
    expected: ":local(.foobar) {}",
  },
  {
    name: "ignore nested selectors that are already local",
    input: ":local(.foo) :local(.bar) {}",
    expected: ":local(.foo) :local(.bar) {}",
  },
  {
    name: "ignore multiple selectors that are already local",
    input: ":local(.foo), :local(.bar) {}",
    expected: ":local(.foo), :local(.bar) {}",
  },
  {
    name: "ignore sibling selectors that are already local",
    input: ":local(.foo) ~ :local(.bar) {}",
    expected: ":local(.foo) ~ :local(.bar) {}",
  },
  {
    name: "ignore psuedo elements that are already local",
    input: ":local(.foo):after {}",
    expected: ":local(.foo):after {}",
  },
  {
    name: "trim whitespace after empty broad selector",
    input: ".bar :global :global {}",
    expected: ":local(.bar) {}",
  },
  {
    name: "broad global should be limited to selector",
    input: ":global .foo, .bar :global, .foobar :global {}",
    expected: ".foo, :local(.bar), :local(.foobar) {}",
  },
  {
    name: "broad global should be limited to nested selector",
    input: ".foo:not(:global .bar).foobar {}",
    expected: ":local(.foo):not(.bar):local(.foobar) {}",
  },
  {
    name: "broad global and local should allow switching",
    input: ".foo :global .bar :local .foobar :local .barfoo {}",
    expected: ":local(.foo) .bar :local(.foobar) :local(.barfoo) {}",
  },
  {
    name: "localize a single animation-name",
    input: ".foo { animation-name: bar; }",
    expected: ":local(.foo) { animation-name: :local(bar); }",
  },
  {
    name: "not localize a single animation-delay",
    input: ".foo { animation-delay: 1s; }",
    expected: ":local(.foo) { animation-delay: 1s; }",
  },
  {
    name: "localize multiple animation-names",
    input: ".foo { animation-name: bar, foobar; }",
    expected: ":local(.foo) { animation-name: :local(bar), :local(foobar); }",
  },
  {
    name: "localize animation",
    input: ".foo { animation: bar 5s, foobar; }",
    expected: ":local(.foo) { animation: :local(bar) 5s, :local(foobar); }",
  },
  {
    name: "localize animation with vendor prefix",
    input: ".foo { -webkit-animation: bar; animation: bar; }",
    expected:
      ":local(.foo) { -webkit-animation: :local(bar); animation: :local(bar); }",
  },
  {
    name: "not localize other rules",
    input: '.foo { content: "animation: bar;" }',
    expected: ':local(.foo) { content: "animation: bar;" }',
  },
  {
    name: "not localize global rules",
    input: ":global .foo { animation: foo; animation-name: bar; }",
    expected: ".foo { animation: foo; animation-name: bar; }",
  },
  {
    name: "handle a complex animation rule",
    input:
      ".foo { animation: foo, bar 5s linear 2s infinite alternate, barfoo 1s; }",
    expected:
      ":local(.foo) { animation: :local(foo), :local(bar) 5s linear 2s infinite alternate, :local(barfoo) 1s; }",
  },
  {
    name: "handle animations where the first value is not the animation name",
    input: ".foo { animation: 1s foo; }",
    expected: ":local(.foo) { animation: 1s :local(foo); }",
  },
  {
    name:
      "handle animations where the first value is not the animation name whilst also using keywords",
    input: ".foo { animation: 1s normal ease-out infinite foo; }",
    expected:
      ":local(.foo) { animation: 1s normal ease-out infinite :local(foo); }",
  },
  {
    name:
      "not treat animation curve as identifier of animation name even if it separated by comma",
    input:
      ".foo { animation: slide-right 300ms forwards ease-out, fade-in 300ms forwards ease-out; }",
    expected:
      ":local(.foo) { animation: :local(slide-right) 300ms forwards ease-out, :local(fade-in) 300ms forwards ease-out; }",
  },
  {
    name:
      'not treat "start" and "end" keywords in steps() function as identifiers',
    input: [
      ".foo { animation: spin 1s steps(12, end) infinite; }",
      ".foo { animation: spin 1s STEPS(12, start) infinite; }",
      ".foo { animation: spin 1s steps(12, END) infinite; }",
      ".foo { animation: spin 1s steps(12, START) infinite; }",
    ].join("\n"),
    expected: [
      ":local(.foo) { animation: :local(spin) 1s steps(12, end) infinite; }",
      ":local(.foo) { animation: :local(spin) 1s STEPS(12, start) infinite; }",
      ":local(.foo) { animation: :local(spin) 1s steps(12, END) infinite; }",
      ":local(.foo) { animation: :local(spin) 1s steps(12, START) infinite; }",
    ].join("\n"),
  },
  {
    name: "handle animations with custom timing functions",
    input:
      ".foo { animation: 1s normal cubic-bezier(0.25, 0.5, 0.5. 0.75) foo; }",
    expected:
      ":local(.foo) { animation: 1s normal cubic-bezier(0.25, 0.5, 0.5. 0.75) :local(foo); }",
  },
  {
    name: "handle animations whose names are keywords",
    input: ".foo { animation: 1s infinite infinite; }",
    expected: ":local(.foo) { animation: 1s infinite :local(infinite); }",
  },
  {
    name: 'handle not localize an animation shorthand value of "inherit"',
    input: ".foo { animation: inherit; }",
    expected: ":local(.foo) { animation: inherit; }",
  },
  {
    name: 'handle "constructor" as animation name',
    input: ".foo { animation: constructor constructor; }",
    expected:
      ":local(.foo) { animation: :local(constructor) :local(constructor); }",
  },
  {
    name: "default to global when mode provided",
    input: ".foo {}",
    options: { mode: "global" },
    expected: ".foo {}",
  },
  {
    name: "default to local when mode provided",
    input: ".foo {}",
    options: { mode: "local" },
    expected: ":local(.foo) {}",
  },
  {
    name: "use correct spacing",
    input: [
      ".a :local .b {}",
      ".a:local.b {}",
      ".a:local(.b) {}",
      ".a:local( .b ) {}",
      ".a :local(.b) {}",
      ".a :local( .b ) {}",
      ":local(.a).b {}",
      ":local( .a ).b {}",
      ":local(.a) .b {}",
      ":local( .a ) .b {}",
    ].join("\n"),
    options: { mode: "global" },
    expected: [
      ".a :local(.b) {}",
      ".a:local(.b) {}",
      ".a:local(.b) {}",
      ".a:local(.b) {}",
      ".a :local(.b) {}",
      ".a :local(.b) {}",
      ":local(.a).b {}",
      ":local(.a).b {}",
      ":local(.a) .b {}",
      ":local(.a) .b {}",
    ].join("\n"),
  },
  {
    name: "localize keyframes",
    input: "@keyframes foo { from { color: red; } to { color: blue; } }",
    expected:
      "@keyframes :local(foo) { from { color: red; } to { color: blue; } }",
  },
  {
    name: "localize keyframes in global default mode",
    input: "@keyframes foo {}",
    options: { mode: "global" },
    expected: "@keyframes foo {}",
  },
  {
    name: "localize explicit keyframes",
    input:
      "@keyframes :local(foo) { 0% { color: red; } 33.3% { color: yellow; } 100% { color: blue; } } @-webkit-keyframes :global(bar) { from { color: red; } to { color: blue; } }",
    expected:
      "@keyframes :local(foo) { 0% { color: red; } 33.3% { color: yellow; } 100% { color: blue; } } @-webkit-keyframes bar { from { color: red; } to { color: blue; } }",
  },
  {
    name: "ignore :export statements",
    input: ":export { foo: __foo; }",
    expected: ":export { foo: __foo; }",
  },
  {
    name: "ignore :import statemtents",
    input: ':import("~/lol.css") { foo: __foo; }',
    expected: ':import("~/lol.css") { foo: __foo; }',
  },
  {
    name: "incorrectly handle nested selectors",
    input: ".bar:not(:global .foo, .baz) {}",
    expected: ":local(.bar):not(.foo, .baz) {}",
  },
  {
    name: "compile in pure mode",
    input: ':global(.foo).bar, [type="radio"] ~ .label, :not(.foo), #bar {}',
    options: { mode: "pure" },
    expected:
      '.foo:local(.bar), [type="radio"] ~ :local(.label), :not(:local(.foo)), :local(#bar) {}',
  },
  {
    name: "compile explict global element",
    input: ":global(input) {}",
    expected: "input {}",
  },
  {
    name: "compile explict global attribute",
    input: ':global([type="radio"]), :not(:global [type="radio"]) {}',
    expected: '[type="radio"], :not([type="radio"]) {}',
  },
  {
    name: "throw on invalid mode",
    input: "",
    options: { mode: "???" },
    error: /"global", "local" or "pure"/,
  },
  {
    name: "throw on inconsistent selector result",
    input: ":global .foo, .bar {}",
    error: /Inconsistent/,
  },
  {
    name: "throw on nested :locals",
    input: ":local(:local(.foo)) {}",
    error: /is not allowed inside/,
  },
  {
    name: "throw on nested :globals",
    input: ":global(:global(.foo)) {}",
    error: /is not allowed inside/,
  },
  {
    name: "throw on nested mixed",
    input: ":local(:global(.foo)) {}",
    error: /is not allowed inside/,
  },
  {
    name: "throw on nested broad :local",
    input: ":global(:local .foo) {}",
    error: /is not allowed inside/,
  },
  {
    name: "throw on incorrect spacing with broad :global",
    input: ".foo :global.bar {}",
    error: /Missing whitespace after :global/,
  },
  {
    name: "throw on incorrect spacing with broad :local",
    input: ".foo:local .bar {}",
    error: /Missing whitespace before :local/,
  },
  {
    name: "throw on not pure selector (global class)",
    input: ":global(.foo) {}",
    options: { mode: "pure" },
    error: /":global\(\.foo\)" is not pure/,
  },
  {
    name: "throw on not pure selector (with multiple 1)",
    input: ".foo, :global(.bar) {}",
    options: { mode: "pure" },
    error: /".foo, :global\(\.bar\)" is not pure/,
  },
  {
    name: "throw on not pure selector (with multiple 2)",
    input: ":global(.bar), .foo {}",
    options: { mode: "pure" },
    error: /":global\(\.bar\), .foo" is not pure/,
  },
  {
    name: "throw on not pure selector (element)",
    input: "input {}",
    options: { mode: "pure" },
    error: /"input" is not pure/,
  },
  {
    name: "throw on not pure selector (attribute)",
    input: '[type="radio"] {}',
    options: { mode: "pure" },
    error: /"\[type="radio"\]" is not pure/,
  },
  {
    name: "throw on not pure keyframes",
    input: "@keyframes :global(foo) {}",
    options: { mode: "pure" },
    error: /@keyframes :global\(\.\.\.\) is not allowed in pure mode/,
  },
  {
    name: "pass through global element",
    input: "input {}",
    expected: "input {}",
  },
  {
    name: "localise class and pass through element",
    input: ".foo input {}",
    expected: ":local(.foo) input {}",
  },
  {
    name: "pass through attribute selector",
    input: '[type="radio"] {}',
    expected: '[type="radio"] {}',
  },
  {
    name: "not modify urls without option",
    input:
      ".a { background: url(./image.png); }\n" +
      ":global .b { background: url(image.png); }\n" +
      '.c { background: url("./image.png"); }',
    expected:
      ":local(.a) { background: url(./image.png); }\n" +
      ".b { background: url(image.png); }\n" +
      ':local(.c) { background: url("./image.png"); }',
  },
  {
    name: "rewrite url in local block",
    input:
      ".a { background: url(./image.png); }\n" +
      ":global .b { background: url(image.png); }\n" +
      '.c { background: url("./image.png"); }\n' +
      ".c { background: url('./image.png'); }\n" +
      '.d { background: -webkit-image-set(url("./image.png") 1x, url("./image2x.png") 2x); }\n' +
      '@font-face { src: url("./font.woff"); }\n' +
      '@-webkit-font-face { src: url("./font.woff"); }\n' +
      '@media screen { .a { src: url("./image.png"); } }\n' +
      '@keyframes :global(ani1) { 0% { src: url("image.png"); } }\n' +
      '@keyframes ani2 { 0% { src: url("./image.png"); } }\n' +
      "foo { background: end-with-url(something); }",
    options: {
      rewriteUrl: function (global, url) {
        const mode = global ? "global" : "local";
        return "(" + mode + ")" + url + '"' + mode + '"';
      },
    },
    expected:
      ':local(.a) { background: url((local\\)./image.png\\"local\\"); }\n' +
      '.b { background: url((global\\)image.png\\"global\\"); }\n' +
      ':local(.c) { background: url("(local)./image.png\\"local\\""); }\n' +
      ":local(.c) { background: url('(local)./image.png\"local\"'); }\n" +
      ':local(.d) { background: -webkit-image-set(url("(local)./image.png\\"local\\"") 1x, url("(local)./image2x.png\\"local\\"") 2x); }\n' +
      '@font-face { src: url("(local)./font.woff\\"local\\""); }\n' +
      '@-webkit-font-face { src: url("(local)./font.woff\\"local\\""); }\n' +
      '@media screen { :local(.a) { src: url("(local)./image.png\\"local\\""); } }\n' +
      '@keyframes ani1 { 0% { src: url("(global)image.png\\"global\\""); } }\n' +
      '@keyframes :local(ani2) { 0% { src: url("(local)./image.png\\"local\\""); } }\n' +
      "foo { background: end-with-url(something); }",
  },
  {
    name: "not crash on atrule without nodes",
    input: '@charset "utf-8";',
    expected: '@charset "utf-8";',
  },
  {
    name: "not crash on a rule without nodes",
    input: (function () {
      const inner = postcss.rule({ selector: ".b", ruleWithoutBody: true });
      const outer = postcss.rule({ selector: ".a" }).push(inner);
      const root = postcss.root().push(outer);
      inner.nodes = undefined;
      return root;
    })(),
    // postcss-less's stringify would honor `ruleWithoutBody` and omit the trailing `{}`
    expected: ":local(.a) {\n    :local(.b) {}\n}",
  },
  {
    name: "not break unicode characters",
    input: '.a { content: "\\2193" }',
    expected: ':local(.a) { content: "\\2193" }',
  },
  {
    name: "not break unicode characters",
    input: '.a { content: "\\2193\\2193" }',
    expected: ':local(.a) { content: "\\2193\\2193" }',
  },
  {
    name: "not break unicode characters",
    input: '.a { content: "\\2193 \\2193" }',
    expected: ':local(.a) { content: "\\2193 \\2193" }',
  },
  {
    name: "not break unicode characters",
    input: '.a { content: "\\2193\\2193\\2193" }',
    expected: ':local(.a) { content: "\\2193\\2193\\2193" }',
  },
  {
    name: "not break unicode characters",
    input: '.a { content: "\\2193 \\2193 \\2193" }',
    expected: ':local(.a) { content: "\\2193 \\2193 \\2193" }',
  },
  {
    name: "not ignore custom property set",
    input:
      ":root { --title-align: center; --sr-only: { position: absolute; } }",
    expected:
      ":root { --title-align: center; --sr-only: { position: absolute; } }",
  },
  /**
   * Imported aliases
   */
  {
    name: "not localize imported alias",
    input: `
      :import(foo) { a_value: some-value; }

      .foo > .a_value { }
    `,
    expected: `
      :import(foo) { a_value: some-value; }

      :local(.foo) > .a_value { }
    `,
  },
  {
    name: "not localize nested imported alias",
    input: `
      :import(foo) { a_value: some-value; }

      .foo > .a_value > .bar { }
    `,
    expected: `
      :import(foo) { a_value: some-value; }

      :local(.foo) > .a_value > :local(.bar) { }
    `,
  },

  {
    name: "ignore imported in explicit local",
    input: `
      :import(foo) { a_value: some-value; }

      :local(.a_value) { }
    `,
    expected: `
      :import(foo) { a_value: some-value; }

      :local(.a_value) { }
    `,
  },
  {
    name: "escape local context with explict global",
    input: `
      :import(foo) { a_value: some-value; }

      :local .foo :global(.a_value) .bar { }
    `,
    expected: `
      :import(foo) { a_value: some-value; }

      :local(.foo) .a_value :local(.bar) { }
    `,
  },
  {
    name: "respect explicit local",
    input: `
      :import(foo) { a_value: some-value; }

      .a_value :local .a_value .foo :global .a_value { }
    `,
    expected: `
      :import(foo) { a_value: some-value; }

      .a_value :local(.a_value) :local(.foo) .a_value { }
    `,
  },
  {
    name: "not localize imported animation-name",
    input: `
      :import(file) { a_value: some-value; }

      .foo { animation-name: a_value; }
    `,
    expected: `
      :import(file) { a_value: some-value; }

      :local(.foo) { animation-name: a_value; }
    `,
  },
  {
    name: "throw on invalid syntax id usage",
    input: ". {}",
    error: /Invalid class or id selector syntax/,
  },
  {
    name: "throw on invalid syntax class usage",
    input: "# {}",
    error: /Invalid class or id selector syntax/,
  },
  {
    name: "throw on invalid syntax local class usage",
    input: ":local(.) {}",
    error: /Invalid class or id selector syntax/,
  },
  {
    name: "throw on invalid syntax local id usage",
    input: ":local(#) {}",
    error: /Invalid class or id selector syntax/,
  },
  {
    name: "throw on invalid global class usage",
    input: ":global(.) {}",
    error: /Invalid class or id selector syntax/,
  },
  {
    name: "throw on invalid global class usage",
    input: ":global(#) {}",
    error: /Invalid class or id selector syntax/,
  },
  /*
  Bug in postcss-selector-parser
  {
    name: 'throw on invalid global class usage',
    input: ':global() {}',
    error: /:global\(\) can't be empty/
  },
  */
  {
    name: "consider :import statements pure",
    input: ':import("~/lol.css") { foo: __foo; }',
    options: { mode: "pure" },
    expected: ':import("~/lol.css") { foo: __foo; }',
  },
  {
    name: "consider :export statements pure",
    input: ":export { foo: __foo; }",
    options: { mode: "pure" },
    expected: ":export { foo: __foo; }",
  },
];

function process(css, options) {
  return postcss(plugin(options)).process(css).css;
}

describe(name, function () {
  it("should use the postcss plugin api", function () {
    expect(plugin().postcssPlugin).toBe(name);
  });

  tests.forEach(function (testCase) {
    it(testCase.name, () => {
      const { options, error, input } = testCase;

      if (error) {
        expect(() => {
          process(input, options);
        }).toThrow(testCase.error);
      } else {
        const { expected } = testCase;

        expect(expected).toBe(process(input, options));
      }
    });
  });
});
