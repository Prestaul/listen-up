# listen-up
A fast and lightweight event emitter. Supports regular expression event subscriptions and group listener removal.

Inspired strongly by https://github.com/HenrikJoreteg/wildemitter (especially the concept of "groups") so thanks to @HenrikJoreteg and @andyet.

- Very lightweight (and fast)
- Browser and node.js support (browser support with Browserify or similar tool)
- Standard event emitter functionality (i.e. `on`, `off`, `emit`)
- Single event handler registration with `once`
- Handler grouping and bulk removal with `releaseGroup`
- \*Supports factory and mixin patterns for greater flexibility
- \*Support for regex event matching
- \*Consistent arguments passed to handlers regardless of registration method

\*features not in WildEmitter

## Install
```bash
npm install listen-up
```


## Creating emitters

`require('listen-up')([subjectObject])`

Returns a new emitter or the subject object with emitter functionality mixed in.

```js
var makeEmitter = require('listen-up');

// Create an emitter object
var emitter = makeEmitter();

// Create an object as an emitter
var jim = makeEmitter({ name:'Jim' });

// Make an existing object an emitter
var jake = { name:'Jake' };
makeEmitter(jake);

// Mixin in a constructor
function Person(name) {
    this.name = name;
    makeEmitter(this);
}
```


## Usage

```js
// People can be emitters too :)
function Person(name) {
    this.name = name;
    require('listen-up')(this);
}

// Emit events when changes occur
Person.prototype.change = function(name) {
    this.name = name;
    this.emit('change:name', name);
}

var jim = new Person('Jim');

// Listen for a specific event
jim.on('change:name', function(e, name) {
    console.log('"change:name" handler called with:', name);
});

// Listen for all 'change:*' events
jim.on(/^change:/, function(e, name) {
    console.log('"change:*" handler called with:', name);
});

// Only listen for the first '*:name' event
jim.once(/:name$/, function(e, name) {
    console.log('"*:name" handler called with:', name);
});

// This call will trigger all three handlers
jim.change('James');

// Remove handlers for the 'change:name' event 
// (removes only the first of the above handlers)
jim.off('change:name');

// Use groups when adding listeners...
jim .on('change:name', 'ui-listeners', function() {...})
    .on('change:age',  'ui-listeners', function() {...})
    .on('sync',        'ui-listeners', function() {...});

// ...and they can all be removed with a single call.
jim.releaseGroup('ui-listeners');
```


## Emitter API

All emitter methods return the object on which they were called so that you can chain multiple method calls.

### `emitter.on(event[, group], handler)`
Adds an event listener to the emitter. If the `event` argument is a regular expression then it will be used to match against event names.

Arguments:
- event: (String|RegExp) used to identify which events should trigger this handler
- group: (Optional String) can be used to remove many related handlers at once
- handler: (Function) the function to call when a matching event is emitted

```js
require('listen-up')()
    .on('test', log)  // Listen for 'test' events
    .on(/^foo:/, log) // Listen for 'foo:*' events
    .emit('test')     // Logs 'test'
    .emit('test')     // Logs 'test'
    .emit('foo:bar')  // Logs 'foo:bar'
    .emit('foo:bat')  // Logs 'foo:bat'
    .emit('boo:far'); // Logs nothing
```


### `emitter.once(event[, group], handler)`
Adds an event listener but immediately removes the handler the first time it is triggered.

Arguments:
- event: (String|RegExp) used to identify which events should trigger this handler
- group: (Optional String) can be used to remove many related handlers at once
- handler: (Function) the function to call when a matching event is emitted

```js
require('listen-up')()
    .once('test', log)  // Listen for one 'test' event
    .once(/^foo:/, log) // Listen for one 'foo:*' event
    .emit('test')       // Logs 'test'
    .emit('test')       // Logs nothing
    .emit('foo:bar')    // Logs 'foo:bar'
    .emit('foo:bar');   // Logs nothing
```


### `emitter.off(event[, handler])`
Removes handlers for the given event, optionally specifying a specific handler to remove. If `handler` is not passed then all handlers are removed. If a regular expression is passed as `event`, only listeners added with an identical regular expression are removed. The regex *is not* executed to match events for removal.

Arguments:
- event: (String|RegExp) used to identify which event's listeners to remove
- handler: (Optional: Function) if specified then only listeners with this function as a handler will be removed

```js
function log2() { return log.apply(this, arguments); }

require('listen-up')()
    .on('foo:bar', log)  // Listen for 'foo:bar' events
    .on('foo:bar', log2) // Another listener for 'foo:bar' events
    .on(/^foo:/, log)    // Listen for 'foo:*' events
    .emit('foo:bar')     // Logs 'foo:bar' three times
    
    .off('foo:bar', log) // Remove the first handler
    .emit('foo:bar')     // Logs 'foo:bar' twice
    
    .off(/^foo:/)        // Remove the last handler
    .emit('foo:bar')     // Logs 'foo:bar' once
    
    .off('foo:bar')      // Remove the remaining handler
    .emit('foo:bar');    // Logs nothing!
```


### `emitter.releaseGroup(group)`
Removes all event handlers added with the specified group.

Arguments:
- group: (String) remove all listens associated with this group

```js
require('listen-up')()
    .on('test', 'mine', log)    // Add 3 listeners in the same group
    .on(/^foo:/, 'mine', log)
    .on('foo:bar', 'mine', log)
    .releaseGroup('mine')       // Remove all three handlers
    .emit('foo:bar');           // Logs nothing
```


### `emitter.emit(event[, data...])`
Emits an event and calls the handlers on all matching listeners. Additional data can be passed as arguments and they will be forwarded to handlers.

Arguments:
- event: (String) the event

```js
require('listen-up')()
    .on(/^foo:/, log)              // Listen for 'foo:*' events
    .emit('foo:bar')               // Logs 'foo:bar'
    .emit('foo:bar', 'bag')        // Logs 'foo:bar', 'bag'
    .emit('foo:bar', 'baz', 'bat') // Logs 'foo:bar', 'baz', 'bat'
    .emit('boo:far');              // Logs nothing
```

