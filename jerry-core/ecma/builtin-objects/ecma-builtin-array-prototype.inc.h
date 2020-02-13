/* Copyright JS Foundation and other contributors, http://js.foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
 * Array.prototype built-in description
 */

#include "ecma-builtin-helpers-macro-defines.inc.h"

#if ENABLED (JERRY_BUILTIN_ARRAY)

/* Object properties:
 *  (property name, object pointer getter) */

/* ECMA-262 v5, 15.4.4.1 */
OBJECT_VALUE (LIT_MAGIC_STRING_CONSTRUCTOR,
              ECMA_BUILTIN_ID_ARRAY,
              ECMA_PROPERTY_CONFIGURABLE_WRITABLE)

#if ENABLED (JERRY_ES2015)
/* ECMA-262 v6, 22.1.3.31 */
OBJECT_VALUE (LIT_GLOBAL_SYMBOL_UNSCOPABLES,
              ECMA_BUILTIN_ID_ARRAY_PROTOTYPE_UNSCOPABLES,
              ECMA_PROPERTY_FLAG_CONFIGURABLE)
#endif /* ENABLED (JERRY_ES2015) */

/* Number properties:
 *  (property name, object pointer getter) */

/* ECMA-262 v5, 15.4.4 */
NUMBER_VALUE (LIT_MAGIC_STRING_LENGTH,
              0,
              ECMA_PROPERTY_FLAG_WRITABLE)

/* Routine properties:
 *  (property name, C routine name, arguments number or NON_FIXED, value of the routine's length property) */
ROUTINE (LIT_MAGIC_STRING_TO_STRING_UL, ECMA_ARRAY_PROTOTYPE_TO_STRING, 0, 0)
ROUTINE (LIT_MAGIC_STRING_TO_LOCALE_STRING_UL, ECMA_ARRAY_PROTOTYPE_TO_LOCALE_STRING, 0, 0)
ROUTINE (LIT_MAGIC_STRING_CONCAT, ECMA_ARRAY_PROTOTYPE_CONCAT, NON_FIXED, 1)
ROUTINE (LIT_MAGIC_STRING_JOIN, ECMA_ARRAY_PROTOTYPE_JOIN, 1, 1)
ROUTINE (LIT_MAGIC_STRING_POP, ECMA_ARRAY_PROTOTYPE_POP, 0, 0)
ROUTINE (LIT_MAGIC_STRING_PUSH, ECMA_ARRAY_PROTOTYPE_PUSH, NON_FIXED, 1)
ROUTINE (LIT_MAGIC_STRING_REVERSE, ECMA_ARRAY_PROTOTYPE_REVERSE, 0, 0)
ROUTINE (LIT_MAGIC_STRING_SHIFT, ECMA_ARRAY_PROTOTYPE_SHIFT, 0, 0)
ROUTINE (LIT_MAGIC_STRING_SLICE, ECMA_ARRAY_PROTOTYPE_SLICE, 2, 2)
ROUTINE (LIT_MAGIC_STRING_SORT, ECMA_ARRAY_PROTOTYPE_SORT, 1, 1)
ROUTINE (LIT_MAGIC_STRING_SPLICE, ECMA_ARRAY_PROTOTYPE_SPLICE, NON_FIXED, 2)
ROUTINE (LIT_MAGIC_STRING_UNSHIFT, ECMA_ARRAY_PROTOTYPE_UNSHIFT, NON_FIXED, 1)
ROUTINE (LIT_MAGIC_STRING_INDEX_OF_UL, ECMA_ARRAY_PROTOTYPE_INDEX_OF, 2, 1)
ROUTINE (LIT_MAGIC_STRING_LAST_INDEX_OF_UL, ECMA_ARRAY_PROTOTYPE_LAST_INDEX_OF, NON_FIXED, 1)
/* Note these 3 routines must be in this order */
ROUTINE (LIT_MAGIC_STRING_EVERY, ECMA_ARRAY_PROTOTYPE_EVERY, 2, 1)
ROUTINE (LIT_MAGIC_STRING_SOME, ECMA_ARRAY_PROTOTYPE_SOME, 2, 1)
ROUTINE (LIT_MAGIC_STRING_FOR_EACH_UL, ECMA_ARRAY_PROTOTYPE_FOR_EACH, 2, 1)
ROUTINE (LIT_MAGIC_STRING_MAP, ECMA_ARRAY_PROTOTYPE_MAP, 2, 1)
ROUTINE (LIT_MAGIC_STRING_FILTER, ECMA_ARRAY_PROTOTYPE_FILTER, 2, 1)
/* Note these 2 routines must be in this order */
ROUTINE (LIT_MAGIC_STRING_REDUCE, ECMA_ARRAY_PROTOTYPE_REDUCE, 2, 1)
ROUTINE (LIT_MAGIC_STRING_REDUCE_RIGHT_UL, ECMA_ARRAY_PROTOTYPE_REDUCE_RIGHT, 2, 1)
#if ENABLED (JERRY_ES2015)
ROUTINE (LIT_MAGIC_STRING_FIND, ECMA_ARRAY_PROTOTYPE_FIND, 2, 1)
ROUTINE (LIT_MAGIC_STRING_FIND_INDEX, ECMA_ARRAY_PROTOTYPE_FIND_INDEX, 2, 1)
ROUTINE (LIT_MAGIC_STRING_FILL, ECMA_ARRAY_PROTOTYPE_FILL, 3, 1)
ROUTINE (LIT_MAGIC_STRING_COPY_WITHIN, ECMA_ARRAY_PROTOTYPE_COPY_WITHIN, NON_FIXED, 2)
ROUTINE (LIT_MAGIC_STRING_ENTRIES, ECMA_ARRAY_PROTOTYPE_ENTRIES, 0, 0)
ROUTINE (LIT_MAGIC_STRING_KEYS, ECMA_ARRAY_PROTOTYPE_KEYS, 0, 0)
INTRINSIC_PROPERTY (LIT_MAGIC_STRING_VALUES, LIT_INTERNAL_MAGIC_STRING_ARRAY_PROTOTYPE_VALUES)
INTRINSIC_PROPERTY (LIT_GLOBAL_SYMBOL_ITERATOR, LIT_INTERNAL_MAGIC_STRING_ARRAY_PROTOTYPE_VALUES)
#endif /* ENABLED (JERRY_ES2015) */

#endif /* ENABLED (JERRY_BUILTIN_ARRAY) */

#include "ecma-builtin-helpers-macro-undefs.inc.h"
