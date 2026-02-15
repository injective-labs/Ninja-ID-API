-- 修改 reputationScore 字段类型从 integer 改为 float
ALTER TABLE n1nj4_identities 
ALTER COLUMN "reputationScore" TYPE double precision 
USING "reputationScore"::double precision;

-- 验证修改
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'n1nj4_identities' 
AND column_name = 'reputationScore';
