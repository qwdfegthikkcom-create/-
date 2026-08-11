-- Seed data for Malaab (example)

insert into venues (name, region, address, images, capacity_types, description, is_available)
values
('ملعب الكرامة ليلي', 'حي الكرامة', 'شارع 12', array['/stadium1.jpg'], array[7], 'ملعب عشبي صناعي مضاء ليلاً', true),
('ملعب الشرطة سباعي', 'حي الشرطة', 'شارع الشرطة', array['/stadium2.jpg'], array[7,5], 'ملعب سباعي وخماسي، إضاءة ممتازة', false),
('ملعب المدينة الكبير', 'المدينة', 'الطريق العام', array['/stadium3.jpg'], array[11], 'ملعب 11 مع مدرجات صغيرة', true);

-- sample users
insert into users (phone_number, display_name) values
('+964770000001', 'لاعب1'),
('+964770000002', 'لاعب2');

-- sample availabilities
insert into venue_availabilities (venue_id, start_time, end_time, is_booked, price)
select id, now() + interval '1 hour', now() + interval '2 hour', false, 10 from venues limit 1;
