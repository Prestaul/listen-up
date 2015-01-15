var assert = require('chai').assert,
	emitter = require('../');

describe('listen-up', function() {
	function setupTests(getEmitter) {
		it('has a chainable "on" method', function() {
			var instance = getEmitter();
			assert.strictEqual(instance, instance.on('test', function() {}));
		});

		it('has a chainable "once" method', function() {
			var instance = getEmitter();
			assert.strictEqual(instance, instance.once('test', function() {}));
		});

		it('has a chainable "off" method', function() {
			var instance = getEmitter();
			assert.strictEqual(instance, instance.off('test'));
		});

		it('has a chainable "releaseGroup" method', function() {
			var instance = getEmitter();
			assert.strictEqual(instance, instance.releaseGroup('group'));
		});

		it('has a chainable "emit" method', function() {
			var instance = getEmitter();
			assert.strictEqual(instance, instance.emit('test'));
		});

		describe('listener added with "on"', function() {
			it('should throw an error if no handler', function() {
				assert.throws(function() {
					var instance = getEmitter();
					instance.on('test');
				});
			});

			it('should throw an error if group but no handler', function() {
				assert.throws(function() {
					var instance = getEmitter();
					instance.on('test', 'group');
				});
			});

			it('should be called', function() {
				var instance = getEmitter(),
					called = false;
				instance
					.on('test', function() {
						called = true;
					})
					.emit('test');
				assert.isTrue(called);
			});

			it('should not be called for different event', function() {
				var instance = getEmitter(),
					called = false;
				instance
					.on('test', function() {
						called = true;
					})
					.emit('not-test');
				assert.isFalse(called);
			});

			it('should be called with "this" set correctly', function() {
				var instance = getEmitter(),
					called = false;
				instance
					.on('test', function() {
						assert.strictEqual(this, instance);
						called = true;
					})
					.emit('test');
				assert.isTrue(called);
			});

			it('should be called multiple times', function() {
				var instance = getEmitter();
				instance
					.on('test', function() {
						this.called++;
					})
					.emit('test')
					.emit('test');
				assert.strictEqual(instance.called, 2);
			});

			describe('and regex', function() {
				it('should fire on match', function() {
					var instance = getEmitter();
					instance
						.on(/^foo:/, function() {
							this.called++;
						})
						.emit('foo:stuff');
					assert.strictEqual(instance.called, 1);
				});

				it('should not fire if not matched', function() {
					var instance = getEmitter();
					instance
						.on(/^foo:/, function() {
							this.called++;
						})
						.emit('not:foo');
					assert.strictEqual(instance.called, 0);
				});

				describe('removed with off(/regex/)', function() {
					it('should not fire', function() {
						var instance = getEmitter();
						instance
							.on(/^foo:/, function() {
								this.called++;
							})
							.off(/^foo:/)
							.emit('foo:stuff');
						assert.strictEqual(instance.called, 0);
					});

					it('should remove all handlers', function() {
						var instance = getEmitter();
						instance
							.on(/^foo:/, function() {
								this.called++;
							})
							.on(/^foo:/, function() {
								this.called++;
							})
							.off(/^foo:/)
							.emit('foo:stuff');
						assert.strictEqual(instance.called, 0);
					});
				});

				describe('removed with off(/regex/, handler)', function() {
					it('should not fire', function() {
						var instance = getEmitter();
						function handler() {
							this.called++;
						}
						instance
							.on(/^foo:/, handler)
							.off(/^foo:/, handler)
							.emit('foo:stuff');
						assert.strictEqual(instance.called, 0);
					});

					it('should not remove other handlers', function() {
						var instance = getEmitter();
						function handler() {
							this.called += 2;
						}
						instance
							.on(/^foo:/, handler)
							.on(/^foo:/, function() {
								this.called += 3;
							})
							.off(/^foo:/, handler)
							.emit('foo:stuff');
						assert.strictEqual(instance.called, 3);
					});
				});
			});

			describe('removed with off("event")', function() {
				it('should not fire', function() {
					var instance = getEmitter();
					instance
						.on('test', function() {
							this.called++;
						})
						.off('test')
						.emit('test');
					assert.strictEqual(instance.called, 0);
				});

				it('should remove all handlers', function() {
					var instance = getEmitter();
					instance
						.on('test', function() {
							this.called++;
						})
						.on('test', function() {
							this.called++;
						})
						.off('test')
						.emit('test');
					assert.strictEqual(instance.called, 0);
				});
			});

			describe('removed with off("event", handler)', function() {
				it('should not fire', function() {
					var instance = getEmitter();
					function handler() {
						this.called++;
					}
					instance
						.on('test', handler)
						.off('test', handler)
						.emit('test');
					assert.strictEqual(instance.called, 0);
				});

				it('should not remove other handlers', function() {
					var instance = getEmitter();
					function handler() {
						this.called++;
					}
					instance
						.on('test', handler)
						.on('test', function() {
							this.called++;
						}).off('test', handler).emit('test');
					assert.strictEqual(instance.called, 1);
				});
			});

			describe('and group', function() {
				it('should fire', function() {
					var instance = getEmitter();
					instance
						.on('test', 'group', function() {
							this.called++;
						})
						.emit('test');
					assert.strictEqual(instance.called, 1);
				});

				it('should "release" handler', function() {
					var instance = getEmitter();
					instance
						.on('test', 'group', function() {
							this.called++;
						})
						.releaseGroup('group')
						.emit('test');
					assert.strictEqual(instance.called, 0);
				});

				it('should "release" all handlers in group', function() {
					var instance = getEmitter();
					instance
						.on('test', 'group', function() {
							this.called++;
						})
						.on('test2', 'group', function() {
							this.called++;
						})
						.releaseGroup('group')
						.emit('test')
						.emit('test2');
					assert.strictEqual(instance.called, 0);
				});

				it('should not "release" other handlers', function() {
					var instance = getEmitter();
					instance
						.on('test', 'group', function() {
							this.called += 2;
						})
						.on('test', function() {
							this.called += 3;
						})
						.releaseGroup('group')
						.emit('test');
					assert.strictEqual(instance.called, 3);
				});
			});
		});


		describe('listener added with "once"', function() {
			it('should throw an error if no handler', function() {
				assert.throws(function() {
					var instance = getEmitter();
					instance.once('test');
				});
			});

			it('should throw an error if group but no handler', function() {
				assert.throws(function() {
					var instance = getEmitter();
					instance.once('test', 'group');
				});
			});

			it('should be called', function() {
				var instance = getEmitter(),
					called = false;
				instance
					.once('test', function() {
						called = true;
					})
					.emit('test');
				assert.isTrue(called);
			});

			it('should not be called for different event', function() {
				var instance = getEmitter(),
					called = false;
				instance
					.once('test', function() {
						called = true;
					})
					.emit('not-test');
				assert.isFalse(called);
			});

			it('should be called with "this" set correctly', function() {
				var instance = getEmitter(),
					called = false;
				instance
					.once('test', function() {
						assert.strictEqual(this, instance);
						called = true;
					})
					.emit('test');
				assert.isTrue(called);
			});

			it('should be called only once', function() {
				var instance = getEmitter();
				instance
					.once('test', function() {
						this.called++;
					})
					.emit('test')
					.emit('test');
				assert.strictEqual(instance.called, 1);
			});

			describe('and regex', function() {
				it('should fire on match', function() {
					var instance = getEmitter();
					instance
						.once(/^foo:/, function() {
							this.called++;
						})
						.emit('foo:stuff');
					assert.strictEqual(instance.called, 1);
				});

				it('should not fire if not matched', function() {
					var instance = getEmitter();
					instance
						.once(/^foo:/, function() {
							this.called++;
						})
						.emit('not:foo');
					assert.strictEqual(instance.called, 0);
				});

				it('should only fire once', function() {
					var instance = getEmitter();
					instance
						.once(/^foo:/, function() {
							this.called++;
						})
						.emit('foo:stuff')
						.emit('foo:stuff');
					assert.strictEqual(instance.called, 1);
				});

				describe('removed with off(/regex/)', function() {
					it('should not fire', function() {
						var instance = getEmitter();
						instance
							.once(/^foo:/, function() {
								this.called++;
							})
							.off(/^foo:/)
							.emit('foo:stuff');
						assert.strictEqual(instance.called, 0);
					});

					it('should remove all handlers', function() {
						var instance = getEmitter();
						instance
							.once(/^foo:/, function() {
								this.called++;
							})
							.once(/^foo:/, function() {
								this.called++;
							})
							.off(/^foo:/)
							.emit('foo:stuff');
						assert.strictEqual(instance.called, 0);
					});
				});

				describe('removed with off(/regex/, handler)', function() {
					it('should not fire', function() {
						var instance = getEmitter();
						function handler() {
							this.called++;
						}
						instance
							.once(/^foo:/, handler)
							.off(/^foo:/, handler)
							.emit('foo:stuff');
						assert.strictEqual(instance.called, 0);
					});

					it('should not remove other handlers', function() {
						var instance = getEmitter();
						function handler() {
							this.called += 2;
						}
						instance
							.once(/^foo:/, handler)
							.once(/^foo:/, function() {
								this.called += 3;
							})
							.off(/^foo:/, handler)
							.emit('foo:stuff');
						assert.strictEqual(instance.called, 3);
					});
				});
			});

			describe('removed with off("event")', function() {
				it('should not fire', function() {
					var instance = getEmitter();
					instance
						.once('test', function() {
							this.called++;
						})
						.off('test')
						.emit('test');
					assert.strictEqual(instance.called, 0);
				});

				it('should remove all handlers', function() {
					var instance = getEmitter();
					instance
						.once('test', function() {
							this.called++;
						})
						.once('test', function() {
							this.called++;
						})
						.off('test')
						.emit('test');
					assert.strictEqual(instance.called, 0);
				});
			});

			describe('removed with off("event", handler)', function() {
				it('should not fire', function() {
					var instance = getEmitter();
					function handler() {
						this.called++;
					}
					instance
						.once('test', handler)
						.off('test', handler)
						.emit('test');
					assert.strictEqual(instance.called, 0);
				});

				it('should not remove other handlers', function() {
					var instance = getEmitter();
					function handler() {
						this.called++;
					}
					instance
						.once('test', handler)
						.once('test', function() {
							this.called++;
						})
						.off('test', handler)
						.emit('test');
					assert.strictEqual(instance.called, 1);
				});
			});

			describe('and group', function() {
				it('should fire', function() {
					var instance = getEmitter();
					instance
						.on('test', 'group', function() {
							this.called++;
						})
						.emit('test');
					assert.strictEqual(instance.called, 1);
				});

				it('should "release" handler', function() {
					var instance = getEmitter();
					instance
						.on('test', 'group', function() {
							this.called++;
						})
						.releaseGroup('group')
						.emit('test');
					assert.strictEqual(instance.called, 0);
				});

				it('should "release" all handlers in group', function() {
					var instance = getEmitter();
					instance
						.on('test', 'group', function() {
							this.called++;
						})
						.on('test2', 'group', function() {
							this.called++;
						})
						.releaseGroup('group')
						.emit('test')
						.emit('test2');
					assert.strictEqual(instance.called, 0);
				});

				it('should not "release" other handlers', function() {
					var instance = getEmitter();
					instance
						.on('test', 'group', function() {
							this.called += 2;
						})
						.on('test', function() {
							this.called += 3;
						})
						.releaseGroup('group')
						.emit('test');
					assert.strictEqual(instance.called, 3);
				});
			});
		});
	}

	describe('object', function() {
		setupTests(function() {
			var instance = emitter();
			instance.name = 'test';
			instance.called = 0;
			return instance;
		});
	});

	describe('mixed in', function() {
		setupTests(function() {
			return emitter({
				name: 'test',
				called: 0
			});
		});
	});
});
