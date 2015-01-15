# listen-up
A fast and light-weight event emitter. Supports regex event subscriptions and group listener removal.

Inspired by https://github.com/HenrikJoreteg/wildemitter


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

// Build an object as an emitter
var jim = makeEmitter({ name:'Jim' });

// Make an existing object an emitter
var jake = { name:'Jake' };
makeEmitter(jake);

// Construct emitters
function Person(name) {
    this.name = name;
    makeEmitter(this);
}
```


## Emitter API

```js
function Person(name) {
    this.name = name;
    require('listen-up')(this);
}

Person.prototype.change = function(name) {
    this.name = name;
    return this.emit('change:name', name);
}

var jim = new Person('Jim');

// Adding event handlers
jim.on('change:name', function(name) {
    console.log('"change:name" handler called with:', name);
});

jim.on(/^change:/, function(name) {
    console.log('"change:*" handler called with:', name);
});

// Use `once` to remove handler after first call
jim.once(/:name$/, function(name) {
    console.log('"*:name" handler called with:', name);
});

// This call will trigger all three handlers
jim.change('James');

// Remove all handlers for the 'change:name' event
jim.off('change:name');


// Grouped handlers
var bill = new Person('Bill');

bill.on('change:name', 'ui-listeners', function() {...})
    .on('change:age',  'ui-listeners', function() {...})
    .on('sync',        'ui-listeners', function() {...});

// Remove all handlers by group
bill.releaseGroup('ui-listeners');
```
