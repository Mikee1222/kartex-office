-- PENDING: DO NOT APPLY until classification mapping is confirmed by user.
-- Sets material_id + appends Σύνθεση line to description for active product masters.

begin;

update public.product_masters set
  material_id = (select id from public.materials where name = 'Spandex' limit 1),
  description = 'Σύνθεση: 100% Polyester Spandex'
where id = '1f908d3a-2a90-4703-aef7-d8af3a446b9e';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Άλλο/Άγνωστο' limit 1),
  description = 'Σύνθεση: 570gsm'
where id = 'e7e2c6ab-51b3-4d92-88d2-33bce27e425e';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Μικτό Βαμβάκι-Πολυεστέρας' limit 1),
  description = 'Σύνθεση: CVC Πορτογαλίας (Serrana/Nieves/Margarita/Meander/Oia)'
where id = '28b3a9c6-7a80-4d2c-a866-1729c55c9c92';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Άλλο/Άγνωστο' limit 1),
  description = 'Σύνθεση: 345gsm'
where id = '511d3dc9-9e8c-4b20-9fc8-6b60d040b9c6';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Άλλο/Άγνωστο' limit 1),
  description = 'Σύνθεση: Filling 7D Microfiber'
where id = '8d72e210-8913-4f50-9dd3-ffbecdc3ae17';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Βαμβάκι' limit 1),
  description = 'Σύνθεση: 100% Cotton down proof Percale T233, 50%WDD/50% 3D Nanofiber'
where id = '436cd937-0561-4fa6-a5be-0ca7876a18ec';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Βαμβάκι' limit 1),
  description = 'Σύνθεση: 100% Cotton down proof Percale T233, Filling 3D Nanofiber'
where id = '6aec10b2-7d43-4d1e-9da4-91017c19e9ef';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Βαμβάκι' limit 1),
  description = 'Σύνθεση: 100% Cotton down proof Percale T233, Filling 3D Nanofiber'
where id = '0bfb5280-0ccf-4476-99e0-ef9f8878166e';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Μικτό Βαμβάκι-Πολυεστέρας' limit 1),
  description = 'Σύνθεση: Polyester/Cotton'
where id = '79c20fd2-95c6-4831-89df-fb4dca22a232';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Μικτό Βαμβάκι-Πολυεστέρας' limit 1),
  description = 'Σύνθεση: P/C T144'
where id = '5229ebb0-270e-45a2-977e-4b3f9d3dd9f7';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Βαμβάκι' limit 1),
  description = 'Σύνθεση: 100% Cotton Percale T200'
where id = 'b3e93fcd-7118-4b24-bc3b-47aee1f79617';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Βαμβάκι' limit 1),
  description = 'Σύνθεση: 100% Cotton T260'
where id = '9f40eab6-4551-44b7-978b-fb75097b3f07';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Βαμβάκι' limit 1),
  description = 'Σύνθεση: 100% Cotton T300'
where id = 'ad41d137-30ba-4042-83d8-5be0cd640fcb';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Μικτό Βαμβάκι-Πολυεστέρας' limit 1),
  description = 'Σύνθεση: 70% Cotton - 30% Polyester'
where id = '2ea391b4-11d7-42d7-abe5-a5c13014b151';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Βαμβάκι' limit 1),
  description = 'Σύνθεση: 100% Cotton T250'
where id = 'afae3642-35b9-4986-a7e0-450f5ca9cbed';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Μικτό Βαμβάκι-Πολυεστέρας' limit 1),
  description = 'Σύνθεση: CVC Satin Stripe 1cm TC240'
where id = 'f8386e96-3bf2-4284-b53a-4b63c565f4c0';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Μικτό Βαμβάκι-Πολυεστέρας' limit 1),
  description = 'Σύνθεση: CVC Satin Stripe 4mm TC260'
where id = '302aff32-56c8-4c2c-b6c5-cdbec262b004';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Μικτό Βαμβάκι-Πολυεστέρας' limit 1),
  description = 'Σύνθεση: CVC Satin Stripe 5cm TC260'
where id = 'ac4fad7a-4fe1-4694-bae6-34e7037e8710';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Μικτό Βαμβάκι-Πολυεστέρας' limit 1),
  description = 'Σύνθεση: Percale T200 CVC'
where id = '911d93a8-742d-4c5b-9dcf-91908184f0a2';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Βαμβάκι' limit 1),
  description = 'Σύνθεση: 100% Cotton 430gsm'
where id = '0b375707-24bf-4fae-bb83-a71f7de38d93';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Βαμβάκι' limit 1),
  description = 'Σύνθεση: ΠΙΚΕ 100% Cotton 280gsm'
where id = '4b1a0c21-44f1-4c69-8b36-757a18820903';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Βαμβάκι' limit 1),
  description = 'Σύνθεση: 100% Cotton 360gsm'
where id = '1b3bae4c-dda2-4a5f-ab40-b6bf62bd89be';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Βαμβάκι' limit 1),
  description = 'Σύνθεση: 100% Cotton 450gsm Πενιέ'
where id = 'b20087cd-bf4f-4180-81bd-c201227d11c7';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Βαμβάκι' limit 1),
  description = 'Σύνθεση: 100% Cotton 350gsm'
where id = '97c14b3a-6423-45ab-973f-8b9c2b8189cc';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Βαμβάκι' limit 1),
  description = 'Σύνθεση: 100% Cotton 450gsm'
where id = '05f9bb92-b0fb-4aa6-a237-eaf2740dd203';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Βαμβάκι' limit 1),
  description = 'Σύνθεση: 100% Cotton 420gsm'
where id = 'eea24ab1-2176-4869-856a-14291f124929';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Άλλο/Άγνωστο' limit 1)
where id = '545392a7-8de7-4ef5-9b0f-5e5fcdd778a2';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Άλλο/Άγνωστο' limit 1)
where id = '553b216a-4846-4adc-8c0f-9968adfc8a1a';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Πολυεστέρας' limit 1),
  description = 'Σύνθεση: Microfiber 90gsm shell, Filling 200gsm 3D Siliconized Microfiber'
where id = '2c4d6f16-65ed-4672-9581-cf3468a32622';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Βαμβάκι' limit 1),
  description = 'Σύνθεση: 100% Cotton down proof Percale T233, Filling 50%WDD/50% 0.9D Nanofiber'
where id = '1091e3ef-3a3a-489d-b00d-175c95e858de';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Βαμβάκι' limit 1),
  description = 'Σύνθεση: 100% Cotton down proof Percale T233, Filling 200gsm 0.9D Nanofiber'
where id = 'f05de26f-85c0-4654-858f-0f163bbadee4';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Μικτό Βαμβάκι-Πολυεστέρας' limit 1),
  description = 'Σύνθεση: P/C T170'
where id = '74de5506-b2d8-4d9c-bf74-0cd8719e9d6b';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Μικτό Βαμβάκι-Πολυεστέρας' limit 1),
  description = 'Σύνθεση: P/C T144'
where id = '05460568-2fde-4697-bf71-e9f5344a27d7';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Βαμβάκι' limit 1),
  description = 'Σύνθεση: 100% Cotton Percale T200'
where id = '4ca7f453-83dd-4078-a7cc-e5c2101b6dba';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Βαμβάκι' limit 1),
  description = 'Σύνθεση: 100% Cotton T260'
where id = 'ebcba1b7-d3e1-4da6-b6ac-3dca51a67f9f';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Βαμβάκι' limit 1),
  description = 'Σύνθεση: 100% Cotton T300'
where id = '3dca43e7-0f8c-43ad-810e-f2e675c9ef56';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Βαμβάκι' limit 1),
  description = 'Σύνθεση: 100% Cotton T250'
where id = 'ab4bb9da-7551-43d2-a430-47e13bbc30ec';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Μικτό Βαμβάκι-Πολυεστέρας' limit 1),
  description = 'Σύνθεση: CVC Satin Stripe 1cm TC240'
where id = 'c33ab973-15d1-4651-ab66-f2dafc900cba';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Μικτό Βαμβάκι-Πολυεστέρας' limit 1),
  description = 'Σύνθεση: CVC Satin Stripe 4mm TC260'
where id = 'fdcb14a4-ee75-483b-8974-0a72a5cd0679';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Μικτό Βαμβάκι-Πολυεστέρας' limit 1),
  description = 'Σύνθεση: CVC Satin Stripe 5cm TC260'
where id = '0b783167-cbfc-4e0e-af5b-da9b259041c5';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Μικτό Βαμβάκι-Πολυεστέρας' limit 1),
  description = 'Σύνθεση: Percale T200 CVC'
where id = '902fad0f-f576-4e9c-abc3-2f49fa69d219';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Άλλο/Άγνωστο' limit 1)
where id = 'b1cfd1a5-2f43-4544-bebb-4888a9b96013';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Άλλο/Άγνωστο' limit 1)
where id = 'f2381e47-b334-465a-b318-6979b00a2e12';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Άλλο/Άγνωστο' limit 1)
where id = '66a6f974-5416-4e3d-94bf-06b35a388942';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Άλλο/Άγνωστο' limit 1)
where id = '94fdbe22-7ec7-4a5c-a3ed-bf938e257e8d';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Άλλο/Άγνωστο' limit 1)
where id = '65373b53-d9db-4d51-85a9-2f33b49c7dd8';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Άλλο/Άγνωστο' limit 1)
where id = 'c72205f5-dfdf-46d9-8073-0c0414632ec8';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Άλλο/Άγνωστο' limit 1)
where id = '9a76aa89-117c-4c7d-aa3c-8c9a1990e0fa';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Άλλο/Άγνωστο' limit 1)
where id = '03944f82-247b-494f-a3b4-eea0a5fe64e8';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Άλλο/Άγνωστο' limit 1)
where id = 'ab5a91c8-6cb7-4671-a541-1d6ff115b512';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Άλλο/Άγνωστο' limit 1),
  description = 'Σύνθεση: Chloe 240gsm White'
where id = '4a082a22-f63e-404d-a28d-34834996152e';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Άλλο/Άγνωστο' limit 1)
where id = 'fd57c9be-6303-4e63-b015-87e4f04c66bc';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Άλλο/Άγνωστο' limit 1)
where id = 'e281a0d2-1597-4ef1-aa33-9fba684ae83e';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Άλλο/Άγνωστο' limit 1)
where id = 'bb8535c6-4c99-4c9e-af05-f770047e801a';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Άλλο/Άγνωστο' limit 1)
where id = '4f34b5ae-9544-4303-bd32-ee0a28c60f61';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Βαμβάκι' limit 1),
  description = 'Σύνθεση: 100% Cotton'
where id = 'fbde3f8b-cbe0-4ba5-80ca-96ee599fdd47';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Άλλο/Άγνωστο' limit 1)
where id = '67308958-85da-4607-a519-b6c33e725e66';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Άλλο/Άγνωστο' limit 1)
where id = 'c88b5cae-a20e-4b26-a0d6-071594ec18b4';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Άλλο/Άγνωστο' limit 1)
where id = 'fb381037-38b9-4c4d-a818-e9b0c1684479';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Βαμβάκι' limit 1),
  description = 'Σύνθεση: 100% Βαμβάκι Ψαροκόκκαλο 220gsm'
where id = '90d31c23-9e82-46ee-a5dd-38b5262965e5';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Μικτό Βαμβάκι-Πολυεστέρας' limit 1),
  description = 'Σύνθεση: Καπιτονέ P/C'
where id = 'a01a91a9-93ec-429c-89fe-636f20837057';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Άλλο/Άγνωστο' limit 1),
  description = 'Σύνθεση: Πετσετέ + PU Coated'
where id = '8892f521-ca06-4094-b359-0486d7b591cb';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Άλλο/Άγνωστο' limit 1),
  description = 'Σύνθεση: Πετσετέ + PU Coated'
where id = '0631e77d-8af4-46c3-806b-07f96e3264ff';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Βαμβάκι' limit 1),
  description = 'Σύνθεση: Jersey 100% Cotton + PU Coated'
where id = 'c60d728d-e8ba-4307-9cba-a23e0ed97910';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Μικτό Βαμβάκι-Πολυεστέρας' limit 1),
  description = 'Σύνθεση: 50% Cotton - 50% Polyester'
where id = '3e93a71f-f4cb-4dcb-b5ac-a7ef98887d5e';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Μικτό Βαμβάκι-Πολυεστέρας' limit 1),
  description = 'Σύνθεση: P/C T144'
where id = '796ba35c-b520-4eee-92a1-4e2c9ebbcf60';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Βαμβάκι' limit 1),
  description = 'Σύνθεση: 100% Cotton T260'
where id = '1e7daae7-1421-470f-9baa-5fcad140d744';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Βαμβάκι' limit 1),
  description = 'Σύνθεση: 100% Cotton T300'
where id = '77d9e58a-23b9-4cb6-a91c-1c3db1917d88';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Βαμβάκι' limit 1),
  description = 'Σύνθεση: 100% Cotton T250'
where id = '7a87e351-867b-4253-9181-b41dc42a5d2b';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Μικτό Βαμβάκι-Πολυεστέρας' limit 1),
  description = 'Σύνθεση: CVC Satin Stripe 1cm TC240'
where id = '624d3cdd-4903-4e1a-bcd3-4d5e291da35a';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Μικτό Βαμβάκι-Πολυεστέρας' limit 1),
  description = 'Σύνθεση: CVC Satin Stripe 4mm TC260'
where id = '1a28b6dc-a1f3-480e-9118-5a737c92535c';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Μικτό Βαμβάκι-Πολυεστέρας' limit 1),
  description = 'Σύνθεση: CVC Satin Stripe 5cm TC260'
where id = '32959824-d58e-476e-b74e-b53d099ec67a';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Μικτό Βαμβάκι-Πολυεστέρας' limit 1),
  description = 'Σύνθεση: Percale T200 CVC'
where id = '57ad05af-b9c6-478c-ae88-6f050db1fe63';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Άλλο/Άγνωστο' limit 1)
where id = 'a389e0a3-d568-4d4e-8a41-c59543339d5f';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Άλλο/Άγνωστο' limit 1),
  description = 'Σύνθεση: Chloe 240gsm White'
where id = '8e48cabd-90a9-4a29-8f1d-1fde15e4eed0';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Βαμβάκι' limit 1),
  description = 'Σύνθεση: 100% Cotton'
where id = '24433fa2-83fb-45bb-97cd-73469f439930';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Βαμβάκι' limit 1),
  description = 'Σύνθεση: 100% Cotton'
where id = '2001352f-2b3f-4611-b74e-8a3847ac3b40';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Άλλο/Άγνωστο' limit 1)
where id = 'ca576b36-a73d-4663-a961-8cbd74c4ad22';

update public.product_masters set
  material_id = (select id from public.materials where name = 'Μικτό Βαμβάκι-Πολυεστέρας' limit 1),
  description = 'Σύνθεση: CVC Satin Stripe'
where id = 'ad933c4c-222e-4f56-a4ff-6f562f78f447';

commit;
