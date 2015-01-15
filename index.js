var slice = Array.prototype.slice,
	concat = Array.prototype.concat;

function fastFilter(array, test) {
	// Create a new array and push to it because this is much faster than [].filter
	// see: http://jsperf.com/fastfilter-vs-native-array-filter
	var result = [],
		i, len;
	for(i = 0, len = array.length; i < len; i++) {
		if(test(array[i])) result.push(array[i]);
	}
	return result;
}


/**
 * Creates a new event emitter or converts your object into an emitter
 *
 * Usage:
 *     // Basic emitter
 *     var emitter = require('event-emitter')();
 *
 *     // Extending an object
 *     var fooThing = require('event-emitter')({
 *         foo: 'bar'
 *     });
 *
 *     // Equivalent to this
 *     var fooThing = {
 *         foo: 'bar'
 *     };
 *     require('event-emitter')(fooThing);
 */
var eventEmitter = module.exports = function(host) {
	if(host) {
		for(var prop in protoEmitter) host[prop] = protoEmitter[prop];
		return host;
	} else {
		return Object.create(protoEmitter);
	}
};


// The name we'll use to store event data on the emitter. We expose this so that it can be modified if needed.
eventEmitter.EVENT_DATA_PROPERTY = '__eventListenerData__';


// Get event data from an emitter. Lazily create it if it isn't there.
function eventData(emitter) {
	return emitter[eventEmitter.EVENT_DATA_PROPERTY] || Object.defineProperty(emitter, eventEmitter.EVENT_DATA_PROPERTY, {
		value: {},
		enumerable: false
	})[eventEmitter.EVENT_DATA_PROPERTY];
}


// The event emitter prototype
var protoEmitter = {
	on: function(event, group, handler) {
		var listeners = eventData(this);

		if(typeof group === 'function') {
			handler = group;
			group = undefined;
		} else if(typeof handler !== 'function') {
			throw new Error('You must provide a handler function when adding an event listener.');
		}

		if(!(event in listeners)) listeners[event] = [];

		listeners[event].push({
			event: event,
			group: group,
			handler: handler
		});

		return this;
	},

	once: function(event, group, handler) {
		if(typeof group === 'function') {
			handler = group;
			group = undefined;
		} else if(typeof handler !== 'function') {
			throw new Error('You must provide a handler function when adding an event listener.');
		}

		function onceHandler() {
			this.off(event, handler);
			return handler.apply(this, arguments);
		}
		onceHandler.origHandler = handler;

		return this.on(event, group, onceHandler);
	},

	off: function(event, handler) {
		var listeners = eventData(this);

		if(!(event in listeners)) return this;

		if(handler) {
			// Remove any instances of this handler
			listeners[event] = fastFilter(listeners[event], function(listener) {
				return (listener.handler.origHandler || listener.handler) !== handler;
			});
		} else {
			// Remove all listeners for this event
			delete listeners[event];
		}

		return this;
	},

	releaseGroup: function(group) {
		var listeners = eventData(this),
			events = Object.keys(listeners),
			i = events.length;

		while(i--) {
			listeners[events[i]] = fastFilter(listeners[events[i]], function(listener) {
				return listener.group !== group;
			});
		}

		return this;
	},

	emit: function(event /*, ...data */) {
		var listeners = eventData(this),
			events = Object.keys(listeners),
			eventListeners, listener,
			i, iLen, j, jLen;

		event = event.toString();

		// Traverse the listeners and call handlers for matches
		for(i = 0, iLen = events.length; i < iLen; i++) {
			eventListeners = listeners[events[i]];
			for(j = 0, jLen = eventListeners.length; j < jLen; j++) {
				listener = eventListeners[j];
				if(listener.event.test && listener.event.test(event) || listener.event == event)
					listener.handler.apply(this, arguments);
			}
		}

		return this;
	}
};
