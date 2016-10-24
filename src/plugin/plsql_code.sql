FUNCTION apex_clob_load_render (
   p_dynamic_action IN APEX_PLUGIN.T_DYNAMIC_ACTION,
   p_plugin         IN APEX_PLUGIN.T_PLUGIN
)

   RETURN APEX_PLUGIN.T_DYNAMIC_ACTION_RENDER_RESULT

IS

   l_retval        APEX_PLUGIN.T_DYNAMIC_ACTION_RENDER_RESULT;
   l_action        VARCHAR2(10) := NVL(p_dynamic_action.attribute_01, 'RENDER');
   l_change_only   VARCHAR2(1) := NVL(p_dynamic_action.attribute_06, 'Y');
   l_make_blocking VARCHAR2(1) := NVL(p_dynamic_action.attribute_07, 'Y');
   l_show_spinner  VARCHAR2(1) := NVL(p_dynamic_action.attribute_08, 'Y');
   l_crlf          VARCHAR2(2) := CHR(13)||CHR(10);
   l_js_function   VARCHAR2(32767);
   l_onload_code   VARCHAR2(32767);

BEGIN

   IF apex_application.g_debug
   THEN
      apex_plugin_util.debug_dynamic_action(
         p_plugin         => p_plugin,
         p_dynamic_action => p_dynamic_action
      );
   END IF;

   l_onload_code :=
      'apex.jQuery(document).apexClobLoad({'|| l_crlf ||
      '   pluginFilePrefix: "' || p_plugin.file_prefix || '"' || l_crlf ||
      '});';

   apex_javascript.add_onload_code(
      p_code => l_onload_code
   );

   IF l_action = 'RENDER'
   THEN
      l_js_function :=
         'function(){'|| l_crlf ||
         '   apex.jQuery(document).apexClobLoad("renderClob", {' || l_crlf ||
         '      $elmt: this.affectedElements.eq(0),' || l_crlf ||
         '      ajaxIdentifier: "' || apex_plugin.get_ajax_identifier() || '",' || l_crlf ||
         '      showSpinner: "' || l_show_spinner || '"' || l_crlf ||
         '   });'|| l_crlf ||
         '}';
   ELSE
      l_js_function :=
         'function(){'|| l_crlf ||
         '   apex.jQuery(document).apexClobLoad("submitClob", {' || l_crlf ||
         '      $elmt: this.affectedElements.eq(0),' || l_crlf ||
         '      ajaxIdentifier: "' || apex_plugin.get_ajax_identifier() || '",' || l_crlf ||
         '      changeOnly: "' || l_change_only || '",' || l_crlf ||
         '      makeBlocking: "' || l_make_blocking || '",' || l_crlf ||
         '      showSpinner: "' || l_show_spinner || '"' || l_crlf ||
         '   });'|| l_crlf ||
         '}';
   END IF;

   l_retval.javascript_function := l_js_function;

   RETURN l_retval;

END apex_clob_load_render;

FUNCTION apex_clob_load_ajax (
   p_dynamic_action IN APEX_PLUGIN.T_DYNAMIC_ACTION,
   p_plugin         IN APEX_PLUGIN.T_PLUGIN
)

    RETURN APEX_PLUGIN.T_DYNAMIC_ACTION_AJAX_RESULT

IS

   l_retval                   APEX_PLUGIN.T_DYNAMIC_ACTION_AJAX_RESULT;
   l_ajax_function            VARCHAR2(32767) := apex_application.g_x01;
   l_source                   VARCHAR2(20) := NVL(p_dynamic_action.attribute_02, 'COLLECTION');
   l_render_collection_name   VARCHAR2(255) := p_dynamic_action.attribute_03;
   l_query                    VARCHAR2(32767) := p_dynamic_action.attribute_04;
   l_submit_collection_name   VARCHAR2(255) := p_dynamic_action.attribute_05;
   l_column_value_list        APEX_PLUGIN_UTIL.T_COLUMN_VALUE_LIST2;
   l_clob_text                CLOB := EMPTY_CLOB();
   l_token                    VARCHAR2(32000);
   l_chunk_size               NUMBER := 4000;

BEGIN

   IF l_ajax_function = 'RENDER_CLOB'
   THEN
      IF l_source = 'COLLECTION'
      THEN
         IF apex_collection.collection_exists(l_render_collection_name)
         THEN
            SELECT clob001
            INTO l_clob_text
            FROM apex_collections
            WHERE collection_name = l_render_collection_name
               AND seq_id = 1;
         END IF;
      ELSE --must be SQL_QUERY
         BEGIN

            l_column_value_list := apex_plugin_util.get_data2(
               p_sql_statement  => l_query,
               p_min_columns    => 1,
               p_max_columns    => 1,
               p_component_name => p_dynamic_action.action,
               p_first_row      => 1,
               p_max_rows       => 1
            );

         EXCEPTION

            WHEN NO_DATA_FOUND
            THEN
               NULL;

         END;

         IF l_column_value_list.exists(1)
            AND l_column_value_list(1).value_list.exists(1)
         THEN
            l_clob_text := l_column_value_list(1).value_list(1).clob_value;
         END IF;
      END IF;
      
      IF LENGTH(l_clob_text) > 0
      THEN
          FOR i IN 0 .. FLOOR(LENGTH(l_clob_text)/l_chunk_size)
          LOOP
             sys.htp.prn(substr(l_clob_text, i * l_chunk_size + 1, l_chunk_size));
          END LOOP;
      END IF;
   ELSE --must be SUBMIT_CLOB
      dbms_lob.createtemporary(l_clob_text, false, dbms_lob.session);

      FOR i IN 1..apex_application.g_f01.count
      LOOP
         l_token := wwv_flow.g_f01(i);

         IF length(l_token) > 0
         THEN
            dbms_lob.writeappend(l_clob_text, length(l_token), l_token);
         END IF;
      END LOOP;

      apex_collection.create_or_truncate_collection(
         p_collection_name => l_submit_collection_name
      );

      apex_collection.add_member(
         p_collection_name => l_submit_collection_name,
         p_clob001         => l_clob_text
      );
   END IF;

   RETURN l_retval;

END apex_clob_load_ajax;