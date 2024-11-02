"use strict";

const postcss = require("postcss");
const plugin = require("../src");
const name = require("../package.json").name;

const tests = [
  {
    name: "scope selectors",
    input: ".foobar { a_value: some-value; }",
    expected: ":local(.foobar) { a_value: some-value; }",
  },
  {
    name: "scope escaped selectors",
    input: ".\\3A \\) {}",
    expected: ":local(.\\3A \\)) {}",
  },
  {
    name: "scope ids",
    input: "#foobar { a_value: some-value; }",
    expected: ":local(#foobar) { a_value: some-value; }",
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
    input: ".foo, .baz { a_value: some-value; }",
    expected: ":local(.foo), :local(.baz) { a_value: some-value; }",
  },
  {
    name: "scope sibling selectors",
    input: ".foo ~ .baz { a_value: some-value; }",
    expected: ":local(.foo) ~ :local(.baz) { a_value: some-value; }",
  },
  {
    name: "scope psuedo elements",
    input: ".foo:after { a_value: some-value; }",
    expected: ":local(.foo):after { a_value: some-value; }",
  },
  {
    name: "scope media queries",
    input: "@media only screen { .foo { a_value: some-value; } }",
    expected: "@media only screen { :local(.foo) { a_value: some-value; } }",
  },
  {
    name: "allow narrow global selectors",
    input: ":global(.foo .bar) { a_value: some-value; }",
    expected: ".foo .bar { a_value: some-value; }",
  },
  {
    name: "allow narrow local selectors",
    input: ":local(.foo .bar) { a_value: some-value; }",
    expected: ":local(.foo) :local(.bar) { a_value: some-value; }",
  },
  {
    name: "allow broad global selectors",
    input: ":global .foo .bar { a_value: some-value; }",
    expected: ".foo .bar { a_value: some-value; }",
  },
  {
    name: "allow broad local selectors",
    input: ":local .foo .bar { a_value: some-value; }",
    expected: ":local(.foo) :local(.bar) { a_value: some-value; }",
  },
  {
    name: "allow multiple narrow global selectors",
    input: ":global(.foo), :global(.bar) { a_value: some-value; }",
    expected: ".foo, .bar { a_value: some-value; }",
  },
  {
    name: "allow multiple broad global selectors",
    input: ":global .foo, :global .bar { a_value: some-value; }",
    expected: ".foo, .bar { a_value: some-value; }",
  },
  {
    name: "allow multiple broad local selectors",
    input: ":local .foo, :local .bar { a_value: some-value; }",
    expected: ":local(.foo), :local(.bar) { a_value: some-value; }",
  },
  {
    name: "allow narrow global selectors nested inside local styles",
    input: ".foo :global(.foo .bar) { a_value: some-value; }",
    expected: ":local(.foo) .foo .bar { a_value: some-value; }",
  },
  {
    name: "allow broad global selectors nested inside local styles",
    input: ".foo :global .foo .bar { a_value: some-value; }",
    expected: ":local(.foo) .foo .bar { a_value: some-value; }",
  },
  {
    name: "allow parentheses inside narrow global selectors",
    input: ".foo :global(.foo:not(.bar)) { a_value: some-value; }",
    expected: ":local(.foo) .foo:not(.bar) { a_value: some-value; }",
  },
  {
    name: "allow parentheses inside narrow local selectors",
    input: ".foo :local(.foo:not(.bar)) { a_value: some-value; }",
    expected:
      ":local(.foo) :local(.foo):not(:local(.bar)) { a_value: some-value; }",
  },
  {
    name: "allow narrow global selectors appended to local styles",
    input: ".foo:global(.foo.bar) { a_value: some-value; }",
    expected: ":local(.foo).foo.bar { a_value: some-value; }",
  },
  {
    name: "ignore selectors that are already local",
    input: ":local(.foobar) { a_value: some-value; }",
    expected: ":local(.foobar) { a_value: some-value; }",
  },
  {
    name: "ignore nested selectors that are already local",
    input: ":local(.foo) :local(.bar) { a_value: some-value; }",
    expected: ":local(.foo) :local(.bar) { a_value: some-value; }",
  },
  {
    name: "ignore multiple selectors that are already local",
    input: ":local(.foo), :local(.bar) { a_value: some-value; }",
    expected: ":local(.foo), :local(.bar) { a_value: some-value; }",
  },
  {
    name: "ignore sibling selectors that are already local",
    input: ":local(.foo) ~ :local(.bar) { a_value: some-value; }",
    expected: ":local(.foo) ~ :local(.bar) { a_value: some-value; }",
  },
  {
    name: "ignore psuedo elements that are already local",
    input: ":local(.foo):after { a_value: some-value; }",
    expected: ":local(.foo):after { a_value: some-value; }",
  },
  {
    name: "trim whitespace after empty broad selector",
    input: ".bar :global :global { a_value: some-value; }",
    expected: ":local(.bar) { a_value: some-value; }",
  },
  {
    name: "broad global should be limited to selector",
    input:
      ":global .foo, .bar :global, .foobar :global { a_value: some-value; }",
    expected: ".foo, :local(.bar), :local(.foobar) { a_value: some-value; }",
  },
  {
    name: "broad global should be limited to nested selector",
    input: ".foo:not(:global .bar).foobar { a_value: some-value; }",
    expected: ":local(.foo):not(.bar):local(.foobar) { a_value: some-value; }",
  },
  {
    name: "broad global and local should allow switching",
    input:
      ".foo :global .bar :local .foobar :local .barfoo { a_value: some-value; }",
    expected:
      ":local(.foo) .bar :local(.foobar) :local(.barfoo) { a_value: some-value; }",
  },
  {
    name: "localize a single animation-name",
    input: ".foo { animation-name: bar; }",
    expected: ":local(.foo) { animation-name: :local(bar); }",
  },
  {
    name: "localize a single animation-name #2",
    input: ".foo { animation-name: local(bar); }",
    expected: ":local(.foo) { animation-name: :local(bar); }",
  },
  {
    name: "not localize animation-name in a var function",
    input: ".foo { animation-name: var(--bar); }",
    expected: ":local(.foo) { animation-name: var(--bar); }",
  },
  {
    name: "not localize animation-name in a var function #2",
    input: ".foo { animation-name: vAr(--bar); }",
    expected: ":local(.foo) { animation-name: vAr(--bar); }",
  },
  {
    name: "not localize animation-name in an env function",
    input: ".foo { animation-name: env(bar); }",
    expected: ":local(.foo) { animation-name: env(bar); }",
  },
  {
    name: "not localize animation-name in an global function",
    input: ".foo { animation-name: global(bar); }",
    expected: ":local(.foo) { animation-name: bar; }",
  },
  {
    name: "localize and not localize animation-name in mixed case",
    input:
      ".foo { animation-name: fadeInOut, global(moveLeft300px), local(bounce); }",
    expected:
      ":local(.foo) { animation-name: :local(fadeInOut), moveLeft300px, :local(bounce); }",
  },
  {
    name: "localize and not localize animation-name in mixed case #2",
    options: { mode: "global" },
    input:
      ".foo { animation-name: fadeInOut, global(moveLeft300px), local(bounce); }",
    expected:
      ".foo { animation-name: fadeInOut, moveLeft300px, :local(bounce); }",
  },
  {
    name: "localize and not localize animation-name in mixed case #3",
    options: { mode: "pure" },
    input:
      ".foo { animation-name: fadeInOut, global(moveLeft300px), local(bounce); }",
    expected:
      ":local(.foo) { animation-name: :local(fadeInOut), moveLeft300px, :local(bounce); }",
  },
  {
    name: "not localize animation in an global function",
    input: ".foo { animation: global(bar); }",
    expected: ":local(.foo) { animation: bar; }",
  },
  {
    name: "not localize a certain animation in an global function",
    input: ".foo { animation: global(bar), foo; }",
    expected: ":local(.foo) { animation: bar, :local(foo); }",
  },
  {
    name: "localize and not localize a certain animation in mixed case",
    input: ".foo { animation: rotate 1s, global(spin) 3s, local(fly) 6s; }",
    expected:
      ":local(.foo) { animation: :local(rotate) 1s, spin 3s, :local(fly) 6s; }",
  },
  {
    name: "localize and not localize a certain animation in mixed case #2",
    options: { mode: "global" },
    input: ".foo { animation: rotate 1s, global(spin) 3s, local(fly) 6s; }",
    expected: ".foo { animation: rotate 1s, spin 3s, :local(fly) 6s; }",
  },
  {
    name: "localize and not localize a certain animation in mixed case #2",
    options: { mode: "pure" },
    input: ".foo { animation: rotate 1s, global(spin) 3s, local(fly) 6s; }",
    expected:
      ":local(.foo) { animation: :local(rotate) 1s, spin 3s, :local(fly) 6s; }",
  },
  {
    name: "not localize animation-name in an env function #2",
    input: ".foo { animation-name: eNv(bar); }",
    expected: ":local(.foo) { animation-name: eNv(bar); }",
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
    name: "not localize revert",
    input: ".foo { animation: revert; }",
    expected: ":local(.foo) { animation: revert; }",
  },
  {
    name: "not localize revert #2",
    input: ".foo { animation-name: revert; }",
    expected: ":local(.foo) { animation-name: revert; }",
  },
  {
    name: "not localize revert #3",
    input: ".foo { animation-name: revert, foo, none; }",
    expected: ":local(.foo) { animation-name: revert, :local(foo), none; }",
  },
  {
    name: "not localize revert-layer",
    input: ".foo { animation: revert-layer; }",
    expected: ":local(.foo) { animation: revert-layer; }",
  },
  {
    name: "not localize revert",
    input: ".foo { animation-name: revert-layer; }",
    expected: ":local(.foo) { animation-name: revert-layer; }",
  },
  {
    name: "localize animation using special characters",
    input: ".foo { animation: \\@bounce; }",
    expected: ":local(.foo) { animation: :local(\\@bounce); }",
  },
  {
    name: "localize animation using special characters",
    input: ".foo { animation: bou\\@nce; }",
    expected: ":local(.foo) { animation: :local(bou\\@nce); }",
  },
  {
    name: "localize animation using special characters",
    input: ".foo { animation: \\ as; }",
    expected: ":local(.foo) { animation: :local(\\ as); }",
  },
  {
    name: "localize animation using special characters",
    input: ".foo { animation: t\\ t; }",
    expected: ":local(.foo) { animation: :local(t\\ t); }",
  },
  {
    name: "localize animation using special characters",
    input: ".foo { animation: -\\a; }",
    expected: ":local(.foo) { animation: :local(-\\a); }",
  },
  {
    name: "localize animation using special characters",
    input: ".foo { animation: --\\a; }",
    expected: ":local(.foo) { animation: :local(--\\a); }",
  },
  {
    name: "localize animation using special characters",
    input: ".foo { animation: \\a; }",
    expected: ":local(.foo) { animation: :local(\\a); }",
  },
  {
    name: "localize animation using special characters",
    input: ".foo { animation: -\\a; }",
    expected: ":local(.foo) { animation: :local(-\\a); }",
  },
  {
    name: "localize animation using special characters",
    input: ".foo { animation: --; }",
    expected: ":local(.foo) { animation: :local(--); }",
  },
  {
    name: "localize animation using special characters",
    input: ".foo { animation: 😃bounce😃; }",
    expected: ":local(.foo) { animation: :local(😃bounce😃); }",
  },
  {
    name: "not localize revert",
    input: ".foo { animation: --foo; }",
    expected: ":local(.foo) { animation: :local(--foo); }",
  },
  {
    name: "not localize name in nested function",
    input: ".foo { animation: fade .2s var(--easeOutQuart) .1s forwards }",
    expected:
      ":local(.foo) { animation: :local(fade) .2s var(--easeOutQuart) .1s forwards }",
  },
  {
    name: "not localize name in nested function #2",
    input: ".foo { animation: fade .2s env(FOO_BAR) .1s forwards, name }",
    expected:
      ":local(.foo) { animation: :local(fade) .2s env(FOO_BAR) .1s forwards, :local(name) }",
  },
  {
    name: "not localize name in nested function #3",
    input: ".foo { animation: var(--foo-bar) .1s forwards, name }",
    expected:
      ":local(.foo) { animation: var(--foo-bar) .1s forwards, :local(name) }",
  },
  {
    name: "not localize name in nested function #3",
    input: ".foo { animation: var(--foo-bar) .1s forwards name, name }",
    expected:
      ":local(.foo) { animation: var(--foo-bar) .1s forwards :local(name), :local(name) }",
  },
  {
    name: "localize animation",
    input: ".foo { animation: a; }",
    expected: ":local(.foo) { animation: :local(a); }",
  },
  {
    name: "localize animation #2",
    input: ".foo { animation: bar 5s, foobar; }",
    expected: ":local(.foo) { animation: :local(bar) 5s, :local(foobar); }",
  },
  {
    name: "localize animation #3",
    input: ".foo { animation: ease ease; }",
    expected: ":local(.foo) { animation: ease :local(ease); }",
  },
  {
    name: "localize animation #4",
    input: ".foo { animation: 0s ease 0s 1 normal none test running; }",
    expected:
      ":local(.foo) { animation: 0s ease 0s 1 normal none :local(test) running; }",
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
    name: "handle nested global",
    input: ":global .a:not(:global .b) { a_value: some-value; }",
    expected: ".a:not(.b) { a_value: some-value; }",
  },
  {
    name: "handle nested global #1",
    input:
      ":global .a:not(:global .b:not(:global .c)) { a_value: some-value; }",
    expected: ".a:not(.b:not(.c)) { a_value: some-value; }",
  },
  {
    name: "handle nested global #2",
    input: ":local .a:not(:not(:not(:global .c))) { a_value: some-value; }",
    expected: ":local(.a):not(:not(:not(.c))) { a_value: some-value; }",
  },
  {
    name: "handle nested global #3",
    input: ":global .a:not(:global .b, :global .c) { a_value: some-value; }",
    expected: ".a:not(.b, .c) { a_value: some-value; }",
  },
  {
    name: "handle nested global #4",
    input: ":local .a:not(:global .b, :local .c) { a_value: some-value; }",
    expected: ":local(.a):not(.b, :local(.c)) { a_value: some-value; }",
  },
  {
    name: "handle nested global #5",
    input: ":global .a:not(:local .b, :global .c) { a_value: some-value; }",
    expected: ".a:not(:local(.b), .c) { a_value: some-value; }",
  },
  {
    name: "handle nested global #6",
    input: ":global .a:not(.b, .c) { a_value: some-value; }",
    expected: ".a:not(.b, .c) { a_value: some-value; }",
  },
  {
    name: "handle nested global #7",
    input: ":local .a:not(.b, .c) { a_value: some-value; }",
    expected: ":local(.a):not(:local(.b), :local(.c)) { a_value: some-value; }",
  },
  {
    name: "handle nested global #8",
    input: ":global .a:not(:local .b, .c) { a_value: some-value; }",
    expected: ".a:not(:local(.b), :local(.c)) { a_value: some-value; }",
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
    name: "handle animations where the first value is not the animation name whilst also using keywords",
    input: ".foo { animation: 1s normal ease-out infinite foo; }",
    expected:
      ":local(.foo) { animation: 1s normal ease-out infinite :local(foo); }",
  },
  {
    name: "not treat animation curve as identifier of animation name even if it separated by comma",
    input:
      ".foo { animation: slide-right 300ms forwards ease-out, fade-in 300ms forwards ease-out; }",
    expected:
      ":local(.foo) { animation: :local(slide-right) 300ms forwards ease-out, :local(fade-in) 300ms forwards ease-out; }",
  },
  {
    name: 'not treat "start" and "end" keywords in steps() function as identifiers',
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
    input: ".foo { a_value: some-value; }",
    options: { mode: "global" },
    expected: ".foo { a_value: some-value; }",
  },
  {
    name: "default to local when mode provided",
    input: ".foo { a_value: some-value; }",
    options: { mode: "local" },
    expected: ":local(.foo) { a_value: some-value; }",
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
    input:
      "@keyframes foo { from: { a_value: some-value; } to { a_value: some-value; } }",
    expected:
      "@keyframes :local(foo) { from: { a_value: some-value; } to { a_value: some-value; } }",
  },
  {
    name: "localize keyframes starting with special characters",
    input: "@keyframes \\@foo { from { color: red; } to { color: blue; } }",
    expected:
      "@keyframes :local(\\@foo) { from { color: red; } to { color: blue; } }",
  },
  {
    name: "localize keyframes containing special characters",
    input: "@keyframes f\\@oo { from { color: red; } to { color: blue; } }",
    expected:
      "@keyframes :local(f\\@oo) { from { color: red; } to { color: blue; } }",
  },
  {
    name: "localize keyframes in global default mode",
    input: "@keyframes foo { a_value: some-value; }",
    options: { mode: "global" },
    expected: "@keyframes foo { a_value: some-value; }",
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
    input: ".bar:not(:global .foo, .baz) { a_value: some-value; }",
    expected: ":local(.bar):not(.foo, .baz) { a_value: some-value; }",
  },
  {
    name: "compile in pure mode",
    input:
      ':global(.foo).bar, [type="radio"] ~ .label, :not(.foo), #bar { a_value: some-value; }',
    options: { mode: "pure" },
    expected:
      '.foo:local(.bar), [type="radio"] ~ :local(.label), :not(:local(.foo)), :local(#bar) { a_value: some-value; }',
  },
  {
    name: "compile explict global element",
    input: ":global(input) { a_value: some-value; }",
    expected: "input { a_value: some-value; }",
  },
  {
    name: "compile explict global attribute",
    input:
      ':global([type="radio"]), :not(:global [type="radio"]) { a_value: some-value; }',
    expected: '[type="radio"], :not([type="radio"]) { a_value: some-value; }',
  },
  {
    name: "throw on invalid mode",
    input: "",
    options: { mode: "???" },
    error: /"global", "local" or "pure"/,
  },
  {
    name: "throw on inconsistent selector result",
    input: ":global .foo, .bar { a_value: some-value; }",
    error: /Inconsistent/,
  },
  {
    name: "throw on nested :locals",
    input: ":local(:local(.foo)) { a_value: some-value; }",
    error: /is not allowed inside/,
  },
  {
    name: "throw on nested :globals",
    input: ":global(:global(.foo)) { a_value: some-value; }",
    error: /is not allowed inside/,
  },
  {
    name: "throw on nested mixed",
    input: ":local(:global(.foo)) { a_value: some-value; }",
    error: /is not allowed inside/,
  },
  {
    name: "throw on nested broad :local",
    input: ":global(:local .foo) { a_value: some-value; }",
    error: /is not allowed inside/,
  },
  {
    name: "throw on incorrect spacing with broad :global",
    input: ".foo :global.bar { a_value: some-value; }",
    error: /Missing whitespace after :global/,
  },
  {
    name: "throw on incorrect spacing with broad :local",
    input: ".foo:local .bar { a_value: some-value; }",
    error: /Missing whitespace before :local/,
  },
  {
    name: "throw on not pure selector (global class)",
    input: ":global(.foo) { a_value: some-value; }",
    options: { mode: "pure" },
    error: /":global\(\.foo\)" is not pure/,
  },
  {
    name: "throw on not pure selector (with multiple 1)",
    input: ".foo, :global(.bar) { a_value: some-value; }",
    options: { mode: "pure" },
    error: /".foo, :global\(\.bar\)" is not pure/,
  },
  {
    name: "throw on not pure selector (with multiple 2)",
    input: ":global(.bar), .foo { a_value: some-value; }",
    options: { mode: "pure" },
    error: /":global\(\.bar\), .foo" is not pure/,
  },
  {
    name: "throw on not pure selector (element)",
    input: "input { a_value: some-value; }",
    options: { mode: "pure" },
    error: /"input" is not pure/,
  },
  {
    name: "throw on not pure selector (attribute)",
    input: '[type="radio"] { a_value: some-value; }',
    options: { mode: "pure" },
    error: /"\[type="radio"\]" is not pure/,
  },
  {
    name: "throw on not pure keyframes",
    input: "@keyframes :global(foo) { a_value: some-value; }",
    options: { mode: "pure" },
    error: /@keyframes :global\(\.\.\.\) is not allowed in pure mode/,
  },
  {
    name: "pass through global element",
    input: "input { a_value: some-value; }",
    expected: "input { a_value: some-value; }",
  },
  {
    name: "localise class and pass through element",
    input: ".foo input { a_value: some-value; }",
    expected: ":local(.foo) input { a_value: some-value; }",
  },
  {
    name: "pass through attribute selector",
    input: '[type="radio"] { a_value: some-value; }',
    expected: '[type="radio"] { a_value: some-value; }',
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

      .foo > .a_value { a_value: some-value; }
    `,
    expected: `
      :import(foo) { a_value: some-value; }

      :local(.foo) > .a_value { a_value: some-value; }
    `,
  },
  {
    name: "not localize nested imported alias",
    input: `
      :import(foo) { a_value: some-value; }

      .foo > .a_value > .bar { a_value: some-value; }
    `,
    expected: `
      :import(foo) { a_value: some-value; }

      :local(.foo) > .a_value > :local(.bar) { a_value: some-value; }
    `,
  },

  {
    name: "ignore imported in explicit local",
    input: `
      :import(foo) { a_value: some-value; }

      :local(.a_value) { a_value: some-value; }
    `,
    expected: `
      :import(foo) { a_value: some-value; }

      :local(.a_value) { a_value: some-value; }
    `,
  },
  {
    name: "escape local context with explict global",
    input: `
      :import(foo) { a_value: some-value; }

      :local .foo :global(.a_value) .bar { a_value: some-value; }
    `,
    expected: `
      :import(foo) { a_value: some-value; }

      :local(.foo) .a_value :local(.bar) { a_value: some-value; }
    `,
  },
  {
    name: "respect explicit local",
    input: `
      :import(foo) { a_value: some-value; }

      .a_value :local .a_value .foo :global .a_value { a_value: some-value; }
    `,
    expected: `
      :import(foo) { a_value: some-value; }

      .a_value :local(.a_value) :local(.foo) .a_value { a_value: some-value; }
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
    input: ". { a_value: some-value; }",
    error: /Invalid class or id selector syntax/,
  },
  {
    name: "throw on invalid syntax class usage",
    input: "# { a_value: some-value; }",
    error: /Invalid class or id selector syntax/,
  },
  {
    name: "throw on invalid syntax local class usage",
    input: ":local(.) { a_value: some-value; }",
    error: /Invalid class or id selector syntax/,
  },
  {
    name: "throw on invalid syntax local id usage",
    input: ":local(#) { a_value: some-value; }",
    error: /Invalid class or id selector syntax/,
  },
  {
    name: "throw on invalid global class usage",
    input: ":global(.) { a_value: some-value; }",
    error: /Invalid class or id selector syntax/,
  },
  {
    name: "throw on invalid global class usage",
    input: ":global(#) { a_value: some-value; }",
    error: /Invalid class or id selector syntax/,
  },
  {
    name: "throw on invalid global class usage",
    input: ":global(.a:not(:global .b, :global .c)) { a_value: some-value; }",
    error: /A :global is not allowed inside of a :global/,
  },
  {
    name: "consider & statements as pure",
    input: ".foo { &:hover { a_value: some-value; } }",
    options: { mode: "pure" },
    expected: ":local(.foo) { &:hover { a_value: some-value; } }",
  },
  {
    name: "consider global inside local as pure",
    input: ".foo button { a_value: some-value; }",
    options: { mode: "pure" },
    expected: ":local(.foo) button { a_value: some-value; }",
  },
  {
    name: "consider selector & statements as pure",
    input: ".foo { html &:hover { a_value: some-value; } }",
    options: { mode: "pure" },
    expected: ":local(.foo) { html &:hover { a_value: some-value; } }",
  },
  {
    name: "consider selector & statements as pure",
    input: ".foo { &:global(.bar) { a_value: some-value; } }",
    options: { mode: "pure" },
    expected: ":local(.foo) { &.bar { a_value: some-value; } }",
  },
  {
    name: "throw on nested & selectors without a local selector",
    input: ":global(.foo) { &:hover { a_value: some-value; } }",
    options: { mode: "pure" },
    error: /is not pure/,
  },
  {
    name: "css nesting",
    input: `
.foo {
  &.class {
    a_value: some-value;
  }

  @media screen and (min-width: 900px) {
    b_value: some-value;

    .bar {
      c_value: some-value;
    }

    &.baz {
      c_value: some-value;
    }
  }
}`,
    expected: `
:local(.foo) {
  &:local(.class) {
    a_value: some-value;
  }

  @media screen and (min-width: 900px) {
    b_value: some-value;

    :local(.bar) {
      c_value: some-value;
    }

    &:local(.baz) {
      c_value: some-value;
    }
  }
}`,
  },
  {
    name: "css nesting #1",
    options: { mode: "global" },
    input: `
:local(.foo) {
  &:local(.class) {
    a_value: some-value;
  }

  @media screen and (min-width: 900px) {
    b_value: some-value;

    :local(.bar) {
      c_value: some-value;
    }

    &:local(.baz) {
      c_value: some-value;
    }
  }
}`,
    expected: `
:local(.foo) {
  &:local(.class) {
    a_value: some-value;
  }

  @media screen and (min-width: 900px) {
    b_value: some-value;

    :local(.bar) {
      c_value: some-value;
    }

    &:local(.baz) {
      c_value: some-value;
    }
  }
}`,
  },
  {
    name: "css nesting #2",
    options: { mode: "pure" },
    input: `
.foo {
  &.class {
    a_value: some-value;
  }

  @media screen and (min-width: 900px) {
    b_value: some-value;

    .bar {
      c_value: some-value;
    }

    &.baz {
      c_value: some-value;
    }
  }
}`,
    expected: `
:local(.foo) {
  &:local(.class) {
    a_value: some-value;
  }

  @media screen and (min-width: 900px) {
    b_value: some-value;

    :local(.bar) {
      c_value: some-value;
    }

    &:local(.baz) {
      c_value: some-value;
    }
  }
}`,
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
  {
    name: "handle negative animation-delay in animation shorthand",
    input: ".foo { animation: 1s -500ms; }",
    expected: ":local(.foo) { animation: 1s -500ms; }",
  },
  {
    name: "handle negative animation-delay in animation shorthand #1",
    input: ".foo { animation: 1s -500.0ms; }",
    expected: ":local(.foo) { animation: 1s -500.0ms; }",
  },
  {
    name: "handle negative animation-delay in animation shorthand #2",
    input: ".foo { animation: 1s -500.0ms -a_value; }",
    expected: ":local(.foo) { animation: 1s -500.0ms :local(-a_value); }",
  },
  {
    name: "@scope at-rule",
    input: `
.article-header {
  color: red;
}

.article-body {
  color: blue;
}

@scope      (.article-body)     to       (.article-header)        {
  .article-body {
    border: 5px solid black;
    background-color: goldenrod;
  }
}

@scope(.article-body)to(.article-header){
  .article-footer {
    border: 5px solid black;
  }
}

@scope    (   .article-body   )    {
  img {
    border: 5px solid black;
    background-color: goldenrod;
  }
}

@scope {
  :scope {
    color: red;
  }
}
`,
    expected: `
:local(.article-header) {
  color: red;
}

:local(.article-body) {
  color: blue;
}

@scope      (:local(.article-body)) to (:local(.article-header))        {
  :local(.article-body) {
    border: 5px solid black;
    background-color: goldenrod;
  }
}

@scope(:local(.article-body)) to (:local(.article-header)){
  :local(.article-footer) {
    border: 5px solid black;
  }
}

@scope    (:local(.article-body))    {
  img {
    border: 5px solid black;
    background-color: goldenrod;
  }
}

@scope {
  :scope {
    color: red;
  }
}
`,
  },
  {
    name: "@scope at-rule #1",
    input: `
@scope (.article-body) to (figure) {
  .article-footer {
    border: 5px solid black;
  }
}
`,
    expected: `
@scope (:local(.article-body)) to (figure) {
  :local(.article-footer) {
    border: 5px solid black;
  }
}
`,
  },
  {
    name: "@scope at-rule #2",
    input: `
@scope (:local(.article-body)) to (:global(.class)) {
  .article-footer {
    border: 5px solid black;
  }
  :local(.class-1) {
    color: red;
  }
  :global(.class-2) {
    color: blue;
  }
}
`,
    expected: `
@scope (:local(.article-body)) to (.class) {
  :local(.article-footer) {
    border: 5px solid black;
  }
  :local(.class-1) {
    color: red;
  }
  .class-2 {
    color: blue;
  }
}
`,
  },
  {
    name: "@scope at-rule #3",
    options: { mode: "global" },
    input: `
@scope (:local(.article-header)) to (:global(.class)) {
  .article-footer {
    border: 5px solid black;
  }
  :local(.class-1) {
    color: red;
  }
  :global(.class-2) {
    color: blue;
  }
}
`,
    expected: `
@scope (:local(.article-header)) to (.class) {
  .article-footer {
    border: 5px solid black;
  }
  :local(.class-1) {
    color: red;
  }
  .class-2 {
    color: blue;
  }
}
`,
  },
  {
    name: "@scope at-rule #4",
    options: { mode: "pure" },
    input: `
@scope (.article-header) to (.class) {
  .article-footer {
    border: 5px solid black;
  }
  .class-1 {
    color: red;
  }
  .class-2 {
    color: blue;
  }
}
`,
    expected: `
@scope (:local(.article-header)) to (:local(.class)) {
  :local(.article-footer) {
    border: 5px solid black;
  }
  :local(.class-1) {
    color: red;
  }
  :local(.class-2) {
    color: blue;
  }
}
`,
  },
  {
    name: "@scope at-rule #5",
    input: `
@scope (.article-header) to (.class) {
  .article-footer {
    src: url("./font.woff");
  }
}
`,
    options: {
      rewriteUrl: function (global, url) {
        const mode = global ? "global" : "local";
        return "(" + mode + ")" + url + '"' + mode + '"';
      },
    },
    expected: `
@scope (:local(.article-header)) to (:local(.class)) {
  :local(.article-footer) {
    src: url("(local)./font.woff\\"local\\"");
  }
}
`,
  },
  {
    name: "@scope at-rule #6",
    input: `
.foo {
  @scope (.article-header) to (.class) {
    :scope {
      background: blue;
    }

    .bar {
      color: red;
    }
  }
}
`,
    expected: `
:local(.foo) {
  @scope (:local(.article-header)) to (:local(.class)) {
    :scope {
      background: blue;
    }

    :local(.bar) {
      color: red;
    }
  }
}
`,
  },
  {
    name: "@scope at-rule #7",
    options: { mode: "pure" },
    input: `
@scope (:global(.article-header).foo) to (:global(.class).bar) {
  .bar {
    color: red;
  }
}
`,
    expected: `
@scope (.article-header:local(.foo)) to (.class:local(.bar)) {
  :local(.bar) {
    color: red;
  }
}
`,
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
