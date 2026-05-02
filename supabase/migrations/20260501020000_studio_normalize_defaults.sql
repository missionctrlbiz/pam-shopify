alter table studio_packages
  alter column carousel_json set default '{"ratio":"1:1","slides":[],"meta":{"palette":["#041f50","#af5ce9","#ec5185","#ed415b"],"font":"Montserrat"}}'::jsonb,
  alter column captions_json set default '{"instagram":{"body":"","hashtags":[],"chars":0},"facebook":{"body":"","hashtags":[],"chars":0},"linkedin":{"body":"","hashtags":[],"chars":0},"tiktok":{"body":"","hashtags":[],"chars":0}}'::jsonb;

update studio_packages
set carousel_json = '{"ratio":"1:1","slides":[],"meta":{"palette":["#041f50","#af5ce9","#ec5185","#ed415b"],"font":"Montserrat"}}'::jsonb
where carousel_json = '{}'::jsonb
  or not (carousel_json ? 'slides')
  or jsonb_typeof(carousel_json->'slides') <> 'array';

update studio_packages
set captions_json = '{"instagram":{"body":"","hashtags":[],"chars":0},"facebook":{"body":"","hashtags":[],"chars":0},"linkedin":{"body":"","hashtags":[],"chars":0},"tiktok":{"body":"","hashtags":[],"chars":0}}'::jsonb
where captions_json = '{}'::jsonb
  or not (captions_json ? 'instagram')
  or not (captions_json ? 'facebook')
  or not (captions_json ? 'linkedin')
  or not (captions_json ? 'tiktok');
