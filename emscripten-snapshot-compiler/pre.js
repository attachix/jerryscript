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

// Jerryscript Snapshot Compiler
var JSC = {
  isArrayOrNodeBuffer: function (b) {
    if (typeof b !== 'object') {
      return false;
    }
    if (b instanceof Array) {
      return true;
    }
    // Check in case this code is not running in Node.js
    if (typeof Buffer !== 'function') {
      return false;
    }
    return (b instanceof Buffer);
  },

  writeToFile: function (outputPath, outputArray) {
    if (!outputPath) {
      return;
    }
    if (!ENVIRONMENT_IS_NODE) {
      throw new Error(
        'Writing to file is only available when running with Node.js');
    }
    var fs = require('fs');
    fs.writeFileSync(outputPath, outputArray);
  },

  compileBuffer: function (inBuffer, inBufferSize, isForGlobal, isStrict, outputPath) {
    isForGlobal = (isForGlobal === undefined) ? true : Boolean(isForGlobal);
    isStrict = Boolean(isStrict);

    var snapshotOutputBufferSize = 512 * 1024;
    var snapshotOutputBuffer = Module._malloc(snapshotOutputBufferSize);
    var inBufferType;
    if (typeof inBuffer === 'number') {
      inBufferType = 'number';
    } else if (this.isArrayOrNodeBuffer(inBuffer)) {
      inBufferType = 'array';
    } else {
      throw new Error('Unexpected inBuffer type: ' + inBuffer);
    }


    var emscripten_snapshot_compiler_compile = Module.cwrap('emscripten_snapshot_compiler_compile', 'number',
                                [inBufferType, 'number', 'number', 'number', 'number', 'number']);

    var bytesWritten = emscripten_snapshot_compiler_compile(inBuffer, inBufferSize, isForGlobal, isStrict, snapshotOutputBuffer, snapshotOutputBufferSize);
    if (0 === bytesWritten) {
      throw new Error('No snapshot bytes written');
    }
    var rv = Module.HEAPU8.subarray(
      snapshotOutputBuffer, snapshotOutputBuffer + bytesWritten);
    Module._free(snapshotOutputBuffer);
    this.writeToFile(outputPath, rv);
    return rv;
  },

  compileString: function (sourceString, isForGlobal, isStrict, outputPath) {
    var sourceBufferSize = lengthBytesUTF8(sourceString) + 1;
    var sourceUTF8Buffer = Module._malloc(sourceBufferSize);
    var writtenUTF8Size = stringToUTF8(sourceString, sourceUTF8Buffer, sourceBufferSize);
    if (sourceBufferSize < writtenUTF8Size) {
      throw new Error('Error decoding sourceString');
    }
    var rv = this.compileBuffer(
      sourceUTF8Buffer, sourceBufferSize - 1, isForGlobal, isStrict, outputPath);
    Module._free(sourceUTF8Buffer);
    return rv;
  },

  compileFile: function (inputPath, isForGlobal, isStrict, outputPath) {
    if (!ENVIRONMENT_IS_NODE) {
      throw new Error(
        'compileFile() is only available when running with Node.js');
    }
    var fs = require('fs');
    var sourceInputBuffer = fs.readFileSync(inputPath);
    return this.compileBuffer(
      sourceInputBuffer, sourceInputBuffer.length, isForGlobal, isStrict, outputPath);
  },
};


