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

#include "config.h"
#include "jerryscript.h"

#include "../test-common.h"

/**
 * Maximum size of snapshots buffer
 */
#define SNAPSHOT_BUFFER_SIZE (256)

int
main (void)
{
  TEST_INIT ();
  /* Dump / execute snapshot */
  if (jerry_is_feature_enabled (JERRY_FEATURE_SNAPSHOT_SAVE)
      && jerry_is_feature_enabled (JERRY_FEATURE_SNAPSHOT_EXEC))
  {
    static uint32_t global_mode_snapshot_buffer[SNAPSHOT_BUFFER_SIZE];
    static uint32_t eval_mode_snapshot_buffer[SNAPSHOT_BUFFER_SIZE];

    const char *code_to_snapshot_p = "(function () { return 'string from snapshot'; }) ();";

    jerry_init (JERRY_INIT_SHOW_OPCODES);
    size_t global_mode_snapshot_size = jerry_parse_and_save_snapshot ((jerry_char_t *) code_to_snapshot_p,
                                                                      strlen (code_to_snapshot_p),
                                                                      true,
                                                                      false,
                                                                      global_mode_snapshot_buffer,
                                                                      SNAPSHOT_BUFFER_SIZE);
    TEST_ASSERT (global_mode_snapshot_size != 0);
    jerry_cleanup ();

    jerry_init (JERRY_INIT_SHOW_OPCODES);
    size_t eval_mode_snapshot_size = jerry_parse_and_save_snapshot ((jerry_char_t *) code_to_snapshot_p,
                                                                    strlen (code_to_snapshot_p),
                                                                    false,
                                                                    false,
                                                                    eval_mode_snapshot_buffer,
                                                                    SNAPSHOT_BUFFER_SIZE);
    TEST_ASSERT (eval_mode_snapshot_size != 0);
    jerry_cleanup ();

    jerry_init (JERRY_INIT_SHOW_OPCODES);

    jerry_value_t res = jerry_exec_snapshot (global_mode_snapshot_buffer,
                               global_mode_snapshot_size,
                               false);

    TEST_ASSERT (!jerry_value_has_error_flag (res));
    TEST_ASSERT (jerry_value_is_string (res));
    jerry_size_t sz = jerry_get_string_size (res);
    TEST_ASSERT (sz == 20);
    char buffer[32];
    sz = jerry_string_to_char_buffer (res, (jerry_char_t *) buffer, sz);
    TEST_ASSERT (sz == 20);
    jerry_release_value (res);
    TEST_ASSERT (!strncmp (buffer, "string from snapshot", (size_t) sz));
    res = jerry_exec_snapshot (eval_mode_snapshot_buffer,
                               eval_mode_snapshot_size,
                               false);

    TEST_ASSERT (!jerry_value_has_error_flag (res));
    TEST_ASSERT (jerry_value_is_string (res));
    sz = jerry_get_string_size (res);
    TEST_ASSERT (sz == 20);
    sz = jerry_string_to_char_buffer (res, (jerry_char_t *) buffer, sz);
    TEST_ASSERT (sz == 20);
    jerry_release_value (res);
    TEST_ASSERT (!strncmp (buffer, "string from snapshot", (size_t) sz));

    jerry_cleanup ();
  }

  /* Save literals */
  if (jerry_is_feature_enabled (JERRY_FEATURE_SNAPSHOT_SAVE))
  {
    /* C format generation */
    jerry_init (JERRY_INIT_EMPTY);

    static uint32_t literal_buffer_c[SNAPSHOT_BUFFER_SIZE];
    static const char *code_for_c_format_p = "var object = { aa:'fo o', Bb:'max', aaa:'xzy0' };";

    size_t literal_sizes_c_format = jerry_parse_and_save_literals ((jerry_char_t *) code_for_c_format_p,
                                                                   strlen (code_for_c_format_p),
                                                                   false,
                                                                   literal_buffer_c,
                                                                   SNAPSHOT_BUFFER_SIZE,
                                                                   true);
    TEST_ASSERT (literal_sizes_c_format == 203);

    static const char *expected_c_format = (
      "jerry_length_t literal_count = 4;\n\n"
        "jerry_char_ptr_t literals[4] =\n"
        "{\n"
        "  \"Bb\",\n"
        "  \"aa\",\n"
        "  \"aaa\",\n"
        "  \"xzy0\"\n"
        "};\n\n"
        "jerry_length_t literal_sizes[4] =\n"
        "{\n"
        "  2 /* Bb */,\n"
        "  2 /* aa */,\n"
        "  3 /* aaa */,\n"
        "  4 /* xzy0 */\n"
        "};\n"
    );

    TEST_ASSERT (!strncmp ((char *) literal_buffer_c, expected_c_format, literal_sizes_c_format));
    jerry_cleanup ();

    /* List format generation */
    jerry_init (JERRY_INIT_EMPTY);

    static uint32_t literal_buffer_list[SNAPSHOT_BUFFER_SIZE];
    static const char *code_for_list_format_p = "var obj = { a:'aa', bb:'Bb' };";

    size_t literal_sizes_list_format = jerry_parse_and_save_literals ((jerry_char_t *) code_for_list_format_p,
                                                                      strlen (code_for_list_format_p),
                                                                      false,
                                                                      literal_buffer_list,
                                                                      SNAPSHOT_BUFFER_SIZE,
                                                                      false);

    TEST_ASSERT (literal_sizes_list_format == 25);
    TEST_ASSERT (!strncmp ((char *) literal_buffer_list, "1 a\n2 Bb\n2 aa\n2 bb\n3 obj\n", literal_sizes_list_format));

    jerry_cleanup ();
  }

  return 0;
} /* main */
