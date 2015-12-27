DROP TABLE CLOB_TEST CASCADE CONSTRAINTS;

--
-- CLOB_TEST  (Table) 
--
-- Keep table names under 21 characters
--           12345678901234567890123
CREATE TABLE CLOB_TEST
(
  CLOB_ID         NUMBER,
  NAME            VARCHAR2(100 BYTE),
  DESCRIPTION     VARCHAR2(2000 BYTE),
  CLOB_CONTENT    CLOB,
  CLOB_SIZE       NUMBER,
  CREATED_BY      VARCHAR2(50 BYTE),
  CREATED_ON      DATE,
  UPDATED_BY      VARCHAR2(50 BYTE),
  UPDATED_ON      DATE)
;


COMMENT ON TABLE  CLOB_TEST IS  'Main BLOB Content Table- for the CLOB BLOB demonstration';
COMMENT ON COLUMN CLOB_TEST."CLOB_ID"      IS 'Primary Key ID - using SYS_GUID';
COMMENT ON COLUMN CLOB_TEST."NAME"         IS 'Business Logic - Human Name for the file';
COMMENT ON COLUMN CLOB_TEST."DESCRIPTION"  IS 'Business Logic - Details of the contents of the file';
COMMENT ON COLUMN CLOB_TEST."CLOB_CONTENT" IS 'Technical - File Contents';
COMMENT ON COLUMN CLOB_TEST."CLOB_SIZE"    IS 'Technical - File Size Recorded to aid in downloading';
COMMENT ON COLUMN CLOB_TEST."CREATED_BY"   IS 'Business Logic - Standard Who/When';
COMMENT ON COLUMN CLOB_TEST."CREATED_ON"   IS 'Business Logic - Standard Who/When';
COMMENT ON COLUMN CLOB_TEST."UPDATED_BY"   IS 'Business Logic - Standard Who/When';
COMMENT ON COLUMN CLOB_TEST."UPDATED_ON"   IS 'Technical - Standard Who/When - but also used for caching';


--
-- TR_CLOB_TEST_IN_UP  (Trigger) 
--
CREATE OR REPLACE TRIGGER "TR_CLOB_TEST_IN_UP"
BEFORE INSERT OR UPDATE ON  "CLOB_TEST"
REFERENCING NEW AS NEW OLD AS OLD
FOR EACH ROW
BEGIN
/* Using Stndard practice of the APP_USER */
/* Using  sys_guid to reduce the number of objects needed */

  IF INSERTING THEN 
    IF :NEW.CLOB_ID IS NULL THEN
      SELECT to_number(sys_guid(),'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX')
        INTO :NEW.CLOB_ID FROM DUAL;
    END IF;
    :NEW.CREATED_ON := SYSDATE;
    :NEW.CREATED_BY := nvl(v('APP_USER'),USER);
    :NEW.UPDATED_ON := SYSDATE;
    :NEW.UPDATED_BY := nvl(v('APP_USER'),USER);
    :NEW.CLOB_SIZE  := dbms_lob.getlength(:new.CLOB_CONTENT);
  END IF;
  IF UPDATING THEN
    :NEW.UPDATED_ON := SYSDATE;
    :NEW.UPDATED_BY := nvl(v('APP_USER'),USER);
    :NEW.CLOB_SIZE  := dbms_lob.getlength(:new.CLOB_CONTENT);
  END IF;

END;
/
