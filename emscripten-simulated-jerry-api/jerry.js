// Copyright JS Foundation and other contributors, http://js.foundation
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

(function () {
  var global = (new Function('return this;'))();

  // Define garbage collection handler at highest possible scope as
  // a pure function. Defining it in an inner scope has a high risk
  // of accidentally creating retain cycles...
  function _jerryhandleGarbageCollected(internalProps) {
    console.log('GCd:', internalProps);
    Module.ccall(
        '_jerry_call_native_object_free_callbacks',
        null, ['number', 'number', 'number', 'number'],
        [internalProps.nativeInfo, internalProps.nativePtr,
          internalProps.nativeHandleFreeCb, internalProps.nativeHandle]);
  };

  var canHaveInternalProps = function (value) {
    if (value === null) {
      return false;
    }
    var typeStr = typeof value;
    return (typeStr === 'object' || typeStr === 'function');
  };

  var hasInternalProps = function (value) {
    return (canHaveInternalProps(value) && value.__jerryInternalProps);
  };

  global.__jerry = {
    // _jerryToHostValueMap is a 'map' with entry objects that represent what
    // values the native side is holding a reference to (reference count is positive).
    // The _jerryToHostValueMap which will allow us to store and retrieve javascript
    // values from a jerry_value_t, and perform refcounts on values that we still need an
    // internal reference to, and avoid them from being garbage collected.
    _jerryToHostValueMap: {},

    // Counter for the next jerry_value_t value.
    _nextObjectRef: 1,

    _findEntryByHostValue: function (value) {
      if (Number.isNaN(value)) {
        // Special case to find NaN
        for (var jerry_val in this._jerryToHostValueMap) {
          var entry = this._jerryToHostValueMap[jerry_val];
          if (Number.isNaN(entry.value)) {
            return entry;
          }
        }
      } else {
        for (var jerry_val in this._jerryToHostValueMap) {
          var entry = this._jerryToHostValueMap[jerry_val];
          if (entry.value === value) {
            return entry;
          }
        }
      }
      return undefined;
    },

    _findJerryValueByHostValue: function (value) {
      var entry = _findEntryByHostValue(value);
      return entry ? entry.jerry_value : 0;
    },

    _getEntry: function (jerry_value) {
      var entry = this._jerryToHostValueMap[jerry_value];
      if (!entry) {
        console.log(new Error('Entry at ' + jerry_value + ' does not exist').stack);
        throw new Error('Entry at ' + jerry_value + ' does not exist');
      }
      return entry;
    },

    _registerHostValue: function (value, pre_existing_jerry_value) {
      var jerry_value = pre_existing_jerry_value || this._nextObjectRef++;
      var internalProps = {
        jerry_value: jerry_value,
      };
      // Store the internalProps, so we can get the same jerry_value,
      // native handle/pointer, etc. later on, even though it was no longer in
      // the _jerryToHostValueMap (because the native side no longer retained it).
      // We can only do it for object/function values and not for primitives.
      // Primitives will always be kept in _jerryToHostValueMap (and leaked)
      // as a work-around, see this.release()
      if (canHaveInternalProps(value)) {
        if (value.__jerryInternalProps) {
          // Use pre-existing internalProps:
          internalProps = value.__jerryInternalProps
        } else {
          Object.defineProperty(value, '__jerryInternalProps', {
            enumerable: false,
            configurable: false,
            writable: false,
            value: internalProps,
          });
        }
      }
      var entry = {
        jerry_value: jerry_value,
        refCount: 1,
        value: value,
        error: false,
        internalProps: internalProps
      };
      // Install garbage collection callback:
      this.weak(value, _jerryhandleGarbageCollected.bind(this, internalProps));
      this._jerryToHostValueMap[jerry_value] = entry;
      // console.log('created entry ' + jerry_value + ' for ' + value + ' at ' + stackTrace());
      return jerry_value;
    },

    reset: function () {
      this._jerryToHostValueMap = {};
      this._nextObjectRef = 1;
    },

    // Given a jerry value, return the stored javascript value.
    get: function (jerry_value) {
      return this._getEntry(jerry_value).value;
    },

    // Given a javascript value, return a jerry value that refers to it.
    // If the value already exists in the map, increment its refcount and return
    // the jerry value.
    // Otherwise, create a new entry and return the jerry value.
    ref: function (value) {
      var jerry_value;
      var entry;
      // Fast path for already known/marked objects:
      if (hasInternalProps(value)) {
        jerry_value = value.__jerryInternalProps.jerry_value;
        // Note: It's possible there is no entry in the map because the native
        // side did not retain it any more, we need to register it again in that case.
        entry = this._jerryToHostValueMap[jerry_value];
      } else {
        entry = this._findEntryByHostValue(value);
      }
      if (entry) {
        ++entry.refCount;
        return jerry_value || entry.jerry_value;
      }
      return this._registerHostValue(value, jerry_value);
    },

    getRefCount: function (jerry_value) {
      return this._getEntry(jerry_value).refCount;
    },

    // Increase the reference count of the given jerry value
    acquire: function (jerry_value) {
      this._getEntry(jerry_value).refCount++;
      return jerry_value;
    },

    // Decrease the reference count of the given jerry value and delete it if
    // there are no more internal references.
    release: function (ref) {
      var entry = this._getEntry(ref);
      entry.refCount--;

      if (entry.refCount <= 0) {
        // Don't remove primitives like string, number, etc because
        // we would otherwise loose the jerry_value that should be
        // associated with it. (It's not possible to add the
        // __jerryInternalProps property w/o 'boxing' the primitive).
        // The value might get 'sent back' to the native side later on
        // and we want to make sure the jerry_value remains the same for
        // the entirety of the lifetime of the value.
        if (hasInternalProps(entry.value)) {
          // console.log('deleting ' + ref + ' at ' + stackTrace());
          delete this._jerryToHostValueMap[ref];
        }
      }
    },

    setError: function (ref, state) {
      this._getEntry(ref).error = state;
    },

    getError: function (ref) {
      return this._getEntry(ref).error;
    },

    setNativeHandle: function (jerryValue, nativeHandlePtr, freeCallbackPtr) {
      var value = this._getEntry(jerryValue).value;
      if (typeof value !== 'object' && typeof value !== 'function') {
        // jerry_set_object_native_handle is a no-op
        return;
      }
      // The handle and free callback are stored in a property on the value
      // itself. We can't store them in the _jerryToHostValueMap/ref because these only
      // contain
      value.__jerryNativeHandle = {
        nativeHandlePtr: nativeHandlePtr,
        freeCallbackPtr: freeCallbackPtr
      };
    },

    getNativeHandle: function (jerryValue) {
      return this._getEntry(jerryValue).nativeHandlePtr;
    },

    /* Tests whether the host engine supports the __proto__ property to get/set the [[Prototype]] */
    hasProto: ({__proto__: []} instanceof Array),

    /* EM_ASM doesn't allow double quotes nor escape sequences, so define the "use strict" comment string here. */
    getUseStrictComment: function (shouldUseStrict) {
      return shouldUseStrict ? '"use strict";\n' : '';
    },

    create_external_function: function (function_ptr) {
      var f = function () {
        var nativeHandlerArgs = [
          function_ptr, /* the function pointer for us to call */
          __jerry.ref(f), /* ref to the actual js function */
          __jerry.ref(this) /* our this object */
        ];

        var numArgs = arguments.length;
        var jsRefs = [];
        for (var i = 0; i < numArgs; i++) {
          jsRefs.push(__jerry.ref(arguments[i]));
        }

        // Arg 4 is a uint32 array of jerry_value_t arguments
        var jsArgs = Module._malloc(numArgs * 4);
        for (var i = 0; i < numArgs; i++) {
          Module.setValue(jsArgs + i * 4, jsRefs[i], 'i32');
        }
        nativeHandlerArgs.push(jsArgs);
        nativeHandlerArgs.push(numArgs);

        // this is just the classy Emscripten calling. function_ptr is a C-pointer here
        // and we know the signature of the C function as it needs to follow
        var result_ref = Module.ccall('_jerry_call_external_handler',
            'number',
            ['number', 'number', 'number', 'number', 'number'],
            nativeHandlerArgs);

        // Free and release all js args
        Module._free(jsArgs);
        while (jsRefs.length > 0) {
          __jerry.release(jsRefs.pop());
        }

        // decrease refcount of native handler arguments
        __jerry.release(nativeHandlerArgs[1]); // jsFunctionRef
        __jerry.release(nativeHandlerArgs[2]); // our this object

        // delete native handler arguments
        nativeHandlerArgs.length = 0;

        var result_val = __jerry.get(result_ref);
        var has_error = __jerry.getError(result_ref);
        __jerry.release(result_ref);

        if (has_error) {
          throw result_val;
        }

        return result_val;
      };

      return __jerry.ref(f);
    }
  };

  // See if Node.js and 'weak' module is available
  try {
    var weakModule = require('weak');
    __jerry.weak = function (obj, gcCallback) {
      if (obj === null) {
        return obj;
      }
      var typeStr = typeof obj;
      // The `weak` module only works for objects, not for primitive values.
      if (typeStr !== 'object' && typeStr !== 'function') {
        return obj;
      }
      return weakModule(obj, gcCallback);
    }
  }
  catch (e) {
    // When not running in Node.js or the 'weak' module isn't available, just
    // provide a stub. This will cause host JS values that pass in/out of the native side
    // to never be garbage collected. The free callback with jerry_set_object_native_handle
    // and jerry_set_object_native_pointer to never get called.
    console.warn('No `weak` module found in host environment. Will leak memory...')
    __jerry.weak = function (obj, gcCallback) {
      return obj;
    };
  }
})();
