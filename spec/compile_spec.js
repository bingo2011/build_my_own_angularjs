describe('$compile', function() {
	beforeEach(function() {
		delete window.angular;
		publishExternalAPI();
	});

	it('allows creating directives', function() {
		var myModule = window.angular.module('myModule', []);
		myModule.directive('testing', function() { });
		var injector = createInjector(['ng', 'myModule']);
		expect(injector.has('testingDirective')).toBe(true);
	});

	it('allows creating many directives with the same name', function() {
		var myModule = window.angular.module('myModule', []);
		myModule.directive('testing', _.constant({d: 'one'}));
		myModule.directive('testing', _.constant({d: 'two'}));

		var injector = createInjector(['ng', 'myModule']);

		var result = injector.get('testingDirective');
		expect(result.length).toBe(2);
		expect(result[0].d).toEqual('one');
		expect(result[1].d).toEqual('two');
	});

	it('does not allow a directive called hasOwnProperty', function() {
		var myModule = window.angular.module('myModule', []);
		myModule.directive('hasOwnProperty', function() {});
		expect(function() {
			createInjector(['ng', 'myModule']);
		}).toThrow();
	});

	it('allows creating directives with object notation', function() {
		var myModule = window.angular.module('myModule', []);
		myModule.directive({
			a: function() { },
			b: function() { },
			c: function() { }
		});
		var injector = createInjector(['ng', 'myModule']);

		expect(injector.has('aDirective')).toBe(true);
		expect(injector.has('bDirective')).toBe(true);
		expect(injector.has('cDirective')).toBe(true);
	});

	function makeInjectorWithDirectives() {
		var args = arguments;
		return createInjector(['ng', function($compileProvider) {
			$compileProvider.directive.apply($compileProvider, args);
		}]);
	}

	it('compiles element directives from a single element', function() {
		var injector = makeInjectorWithDirectives('myDirective', function() {
			return {
				restrict: 'E',
				compile: function(element) {
					element.data('hasCompiled', true);
				}
			};
		});
	
		injector.invoke(function($compile) {
			var el = $('<my-directive></my-directive>');
			$compile(el);
			expect(el.data('hasCompiled')).toBe(true);
		});
	});

	it('compiles element directives found from several elements', function() {
		var idx = 1;
		var injector = makeInjectorWithDirectives('myDirective', function() {
			return {
				restrict: 'E',
				compile: function(element) {
					element.data('hasCompiled', idx++);
				}
			};
		});
	
		injector.invoke(function($compile) {
			var el = $('<my-directive></my-directive><my-directive></my-directive>');
			$compile(el);
			expect(el.eq(0).data('hasCompiled')).toBe(1);
			expect(el.eq(1).data('hasCompiled')).toBe(2);
		});
	});

	it('compiles element directives from child elements', function() {
		var idx = 1;
		var injector = makeInjectorWithDirectives('myDirective', function() {
			return {
				restrict: 'E',
				compile: function(element) {
					element.data('hasCompiled', idx++);
				}
			};
		});
		injector.invoke(function($compile) {
			var el = $('<div><my-directive></my-directive></div>');
			$compile(el);
			expect(el.data('hasCompiled')).toBeUndefined();
			expect(el.find('> my-directive').data('hasCompiled')).toBe(1);
		});
	});

	it('compiles nested directives', function() {
		var idx = 1;
		var injector = makeInjectorWithDirectives('myDir', function() {
			return {
				restrict: 'E',
				compile: function(element) {
					element.data('hasCompiled', idx++);
				}
			};
		});
		injector.invoke(function($compile) {
			var el = $('<my-dir><my-dir><my-dir/></my-dir></my-dir>');
			$compile(el);
			expect(el.data('hasCompiled')).toBe(1);
			expect(el.find('> my-dir').data('hasCompiled')).toBe(2);
			expect(el.find('> my-dir > my-dir').data('hasCompiled')).toBe(3);
		});
	});

	_.forEach(['x', 'data'], function(prefix) {
		_.forEach([':', '-', '_'], function(delim) {

			it('compiles element directives with ' + prefix+delim + ' prefix', function() {
				var injector = makeInjectorWithDirectives('myDir', function() {
					return {
						restrict: 'E',
						compile: function(element) {
							element.data('hasCompiled', true);
						}
					};
				});
				injector.invoke(function($compile) {
					var el = $('<'+ prefix+delim +'my-dir></' + prefix+delim + 'my-dir>');
					$compile(el);
					expect(el.data('hasCompiled')).toBe(true);
				})
			});
		});
	});

	it('compiles attribute directives', function() {
		var injector = makeInjectorWithDirectives('myDirective', function() {
			return {
				restrict: 'A',
				compile: function(element) {
					element.data('hasCompiled', true);
				}
			};
		});
		injector.invoke(function($compile) {
			var el = $('<div my-directive></div>');
			$compile(el);
			expect(el.data('hasCompiled')).toBe(true);
		});
	});

	it('compiles attribute directives with prefixes', function() {
		var injector = makeInjectorWithDirectives('myDirective', function() {
			return {
				restrict: 'A',
				compile: function(element) {
					element.data('hasCompiled', true);
				}
			};
		});
		injector.invoke(function($compile) {
			var el = $('<div x:my-directive></div>');
			$compile(el);
			expect(el.data('hasCompiled')).toBe(true);
		});
	});

	it('compiles several attribute directives in an element', function() {
		var injector = makeInjectorWithDirectives({
			myDirective: function() {
				return {
					restrict: 'A',
					compile: function(element) {
						element.data('hasCompiled', true);
					}
				};
			},
			mySecondDirective: function() {
				return {
					restrict: 'A',
					compile: function(element) {
						element.data('secondCompiled', true);
					}
				};
			}
		});
		injector.invoke(function($compile) {
			var el = $('<div my-directive my-second-directive></div>');
			$compile(el);
			expect(el.data('hasCompiled')).toBe(true);
			expect(el.data('secondCompiled')).toBe(true);
		});
	});

	it('compiles both element and attributes directives in an element', function() {
		var injector = makeInjectorWithDirectives({
			myDirective: function() {
				return {
					restrict: 'E',
					compile: function(element) {
						element.data('hasCompiled', true);
					}
				};
			},
			mySecondDirective: function() {
				return {
					restrict: 'A',
					compile: function(element) {
						element.data('secondCompiled', true);
					}
				};
			}
		});
		injector.invoke(function($compile) {
			var el = $('<my-directive my-second-directive></my-directive>');
			$compile(el);
			expect(el.data('hasCompiled')).toBe(true);
			expect(el.data('secondCompiled')).toBe(true);
		});
	});

	it('compiles attribute directives with ng-attr prefix', function() {
		var injector = makeInjectorWithDirectives('myDirective', function() {
			return {
				restrict: 'A',
				compile: function(element) {
					element.data('hasCompiled', true);
				}
			};
		});
		injector.invoke(function($compile) {
			var el = $('<div ng-attr-my-directive></div>');
			$compile(el);
			expect(el.data('hasCompiled')).toBe(true);
		});
	});

	it('compiles attribute directives with data:ng-attr prefix', function() {
		var injector = makeInjectorWithDirectives('myDirective', function() {
			return {
				restrict: 'A',
				compile: function(element) {
					element.data('hasCompiled', true);
				}
			};
		});
		injector.invoke(function($compile) {
			var el = $('<div data:ng-attr-my-directive></div>');
			$compile(el);
			expect(el.data('hasCompiled')).toBe(true);
		});
	});

	it('compiles class directives', function() {
		var injector = makeInjectorWithDirectives('myDirective', function() {
			return {
				restrict: 'C',
				compile: function(element) {
					element.data('hasCompiled', true);
				}
			};
		});
		injector.invoke(function($compile) {
			var el = $('<div class="my-directive"></div>');
			$compile(el);
			expect(el.data('hasCompiled')).toBe(true);
		});
	});

	it('compiles several class directives in an element', function() {
		var injector = makeInjectorWithDirectives({
			myDirective: function() {
				return {
					restrict: 'C',
					compile: function(element) {
						element.data('hasCompiled', true);
					}
				};
			},
			mySecondDirective: function() {
				return {
					restrict: 'C',
					compile: function(element) {
						element.data('secondCompiled', true);
					}
				}
			}
		});
		injector.invoke(function($compile) {
			var el = $('<div class="my-directive my-second-directive"></div>');
			$compile(el);
			expect(el.data('hasCompiled')).toBe(true);
			expect(el.data('secondCompiled')).toBe(true);
		});

	});

	it('compiles class directives with prefixes', function() {
		var injector = makeInjectorWithDirectives('myDirective', function() {
			return {
				restrict: 'C',
				compile: function(element) {
					element.data('hasCompiled', true);
				}
			};
		});
		injector.invoke(function($compile) {
			var el = $('<div class="x-my-directive"></div>');
			$compile(el);
			expect(el.data('hasCompiled')).toBe(true);
		});
	});

	it('compiles comment directives', function() {
		var hasCompiled;
		var injector = makeInjectorWithDirectives('myDirective', function() {
			return {
				restrict: 'M',
				compile: function(element) {
					hasCompiled = true;
				}
			}
		});
		injector.invoke(function($compile) {
			var el = $('<!-- directive: my-directive -->')
			$compile(el);
			expect(hasCompiled).toBe(true);
		});
	});

	_.forEach({
    E:    {element: true,  attribute: false, class: false, comment: false},
    A:    {element: false, attribute: true,  class: false, comment: false},
    C:    {element: false, attribute: false, class: true,  comment: false},
    M:    {element: false, attribute: false, class: false, comment: true},
    EA:   {element: true,  attribute: true,  class: false, comment: false},
    AC:   {element: false, attribute: true,  class: true,  comment: false},
    EAM:  {element: true,  attribute: true,  class: false, comment: true},
    EACM: {element: true,  attribute: true,  class: true,  comment: true},
    }, function(expected, restrict) {

	    describe('restricted to '+restrict, function() {
	    	_.forEach({
	    		element:   '<my-directive></my-directive>',
	    		attribute: '<div my-directive></div>',
	    		class:     '<div class="my-directive"></div>',
	    		comment:   '<!-- directive: my-directive -->'
	    	}, function(dom, type) {

	    		it((expect[type] ? 'matches' : 'does not match')+' on '+type, function() {
	    			var hasCompiled = false;
	    			var injector = makeInjectorWithDirectives('myDirective', function() {
	    				return {
	    					restrict: restrict,
	    					compile: function(element) {
	    						hasCompiled = true;
	    					}
	    				}
	    			});
	    			injector.invoke(function($compile) {
	    				var el = $(dom);
	    				$compile(el);
	    				expect(hasCompiled).toBe(expected[type]);
	    			})
	    		});
	    	});
	  	});
	});

	it('applies to attributes when no restrict given', function() {
		var hasCompiled = false;
		var injector = makeInjectorWithDirectives('myDirective', function() {
			return {
				compile: function(element) {
					hasCompiled = true;
				}
			};
		});
		injector.invoke(function($compile) {
			var el = $('<div my-directive></div>');
			$compile(el);
			expect(hasCompiled).toBe(true);
		});
	});

	it('does not apply to elements when no restrict given', function() {
		var hasCompiled = false;
		var injector = makeInjectorWithDirectives('myDirective', function() {
			return {
				compile: function(element) {
					hasCompiled = true;
				}
			};
		});
		injector.invoke(function($compile) {
			var el = $('<my-directive></my-directive>');
			$compile(el);
			expect(hasCompiled).toBe(false);
		});
	});

	it('allows applying a directive to multiple elements', function() {
		var compileEl = false;
		var injector = makeInjectorWithDirectives('myDir', function() {
			return {
				compile: function(element) {
					compileEl = element;
				}
			};
		});
		injector.invoke(function($compile) {
			var el = $('<div my-dir-start></div><span></span><div my-dir-end></div>');
			$compile(el);
			expect(compileEl.length).toBe(3);
		})
	});

	describe('attributes', function() {

	    function registerAndCompile(dirName, domString, callback) {
	      var givenAttrs;
	      var injector = makeInjectorWithDirectives(dirName, function() {
	        return {
	          restrict: 'EACM',
	          compile: function(element, attrs) {
	            givenAttrs = attrs;
	          }
	        };
	      });
	      injector.invoke(function($compile) {
	        var el = $(domString);
	        $compile(el);
	        callback(el, givenAttrs);
	      });
	    }

	    it('passes the element attributes to the compile function', function() {
	      registerAndCompile(
	        'myDirective',
	        '<my-directive my-attr="1" my-other-attr="two"></my-directive>',
	        function(element, attrs) {
	          expect(attrs.myAttr).toEqual('1');
	          expect(attrs.myOtherAttr).toEqual('two');
	        }
	      );
	    });

	    it('trims attribute values', function() {
	      registerAndCompile(
	        'myDirective',
	        '<my-directive my-attr=" val "></my-directive>',
	        function(element, attrs) {
	          expect(attrs.myAttr).toEqual('val');
	        }
	      );
	    });

	    it('sets the value of boolean attributes to true', function() {
	    	registerAndCompile(
	    		'myDirective',
	    		'<input my-directive disabled>',
	    		function(element, attrs) {
	    			expect(attrs.disabled).toBe(true);
	    		}
	    	);
	    });

	    it('does not set the value of custom boolean attributes to true', function() {
	    	registerAndCompile(
	    		'myDirective',
	    		'<input my-directive whatever>',
	    		function(element, attrs) {
	    			expect(attrs.whatever).toEqual('');
	    		}
	    	);
	    });

	    it('allows setting attributes', function() {
	    	registerAndCompile(
	    		'myDirective',
	    		'<my-directive attr="true"></my-directive>',
	    		function(element, attrs) {
	    			attrs.$set('attr', 'false');
	    			expect(attrs.attr).toEqual('false');
	    		}
	    	);
	    });

	    it('sets attributes to DOM', function() {
	    	registerAndCompile(
	    		'myDirective',
	    		'<my-directive attr="true"></my-directive>',
	    		function(element, attrs) {
	    			attrs.$set('attr', 'false');
	    			expect(element.attr('attr')).toEqual('false');
	    		}
	    	);
	    });

	    it('does not set attributes to DOM when flag is false', function() {
	    	registerAndCompile(
	    		'myDirective',
	    		'<my-directive attr="true"></my-directive>',
	    		function(element, attrs) {
	    			attrs.$set('attr', 'false', false);
	    			expect(element.attr('attr')).toEqual('true');
	    		}
	    	);
	    });

	    it('shares attributes between directives', function() {
	    	var attrs1, attrs2;
	    	var injector = makeInjectorWithDirectives({
	    		myDir: function() {
	    			return {
	    				compile: function(element, attrs) {
	    					attrs1 = attrs;
	    				}
	    			};
	    		},
	    		myOtherDir: function() {
	    			return {
	    				compile: function(element, attrs) {
	    					attrs2 = attrs;
	    				}
	    			};
	    		}
	    	});
	    	injector.invoke(function($compile) {
	    		var el = $('<div my-dir my-other-dir></div>');
	    		$compile(el);
	    		expect(attrs1).toBe(attrs2);
	    	});
	    });


	    it('sets prop for boolean attributes', function() {
	    	registerAndCompile(
	    		'myDirective',
	    		'<input my-directive>',
	    		function(element, attrs) {
	    			attrs.$set('disabled', true);
	    			expect(element.prop('disabled')).toBe(true);
	    		}
	    	);
	    });

	    it('sets prop for boolean attributes even when not flushing', function() {
	    	registerAndCompile(
	    		'myDirective',
	    		'<input my-directive>',
	    		function(element, attrs) {
	    			attrs.$set('disabled', true, false);
	    			expect(element.prop('disabled')).toBe(true);
	    		}
	    	);
	    });

	    // it('denormalizes attributes name when explicitly given', function() {
	    	
	    // })
	});
});