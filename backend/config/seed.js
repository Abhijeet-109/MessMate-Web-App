/**
 * seed.js — MessMate seed data with dynamic dates.
 * All dates are relative to TODAY so data never goes stale.
 * Uses native pg query() — no prepare() wrapper.
 */
const bcrypt = require('bcryptjs');

module.exports = async function seed(query) {
  console.log('🌱 Seeding database...');

  const salt = bcrypt.genSaltSync(10);
  const sp = bcrypt.hashSync('student123', salt);
  const ap = bcrypt.hashSync('admin123', salt);

  const now = new Date();

  function daysAgo(d) {
    const dt = new Date(now);
    dt.setDate(dt.getDate() - d);
    return dt.toISOString().split('T')[0];
  }

  function daysFromNow(d) {
    const dt = new Date(now);
    dt.setDate(dt.getDate() + d);
    return dt.toISOString().split('T')[0];
  }

  function tsAgo(days, hours = 12, mins = 0) {
    const dt = new Date(now);
    dt.setDate(dt.getDate() - days);
    dt.setHours(hours, mins, 0, 0);
    return dt.toISOString();
  }

  // ── Users ──────────────────────────────────────────────
  await query('INSERT INTO users (name,email,password,phone,college,role,mess_id) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    ['Abhijeet Kumar','abhijeet@example.com',sp,'+91 98765 43210','MIT Pune','student','m1']);
  await query('INSERT INTO users (name,email,password,phone,college,role,mess_id) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    ['Rahul Owner','owner@annapurna.com',ap,'+91 99887 76655',null,'admin','m1']);
  await query('INSERT INTO users (name,email,password,phone,college,role,mess_id) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    ['Rohan Sharma','rohan@example.com',sp,'+91 91111 22222','MIT Pune','student','m1']);
  await query('INSERT INTO users (name,email,password,phone,college,role,mess_id) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    ['Priya Patel','priya@example.com',sp,'+91 93333 44444','MIT Pune','student','m1']);
  await query('INSERT INTO users (name,email,password,phone,college,role,mess_id) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    ['Amit Kumar','amit@example.com',sp,'+91 95555 66666','MIT Pune','student','m1']);
  await query('INSERT INTO users (name,email,password,phone,college,role,mess_id) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    ['Sneha Rao','sneha@example.com',sp,'+91 97777 88888','MIT Pune','student','m1']);
  await query('INSERT INTO users (name,email,password,phone,college,role,mess_id) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    ['Kavita Deshmukh','kavita@example.com',sp,'+91 90000 11111','MIT Pune','student','m1']);

  // ── Messes ─────────────────────────────────────────────
  await query('INSERT INTO messes (id,name,owner_id,location,contact,thumbnail,is_open,hours_breakfast,hours_lunch,hours_dinner,rating,reviews_count) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',
    ['m1','Annapurna Mess',2,'Near MIT College, Kothrud, Pune','+91 98765 43210',
     'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop',
     1,'7:00 AM - 10:00 AM','12:00 PM - 3:00 PM','7:00 PM - 10:00 PM',4.5,120]);
  await query('INSERT INTO messes (id,name,owner_id,location,contact,thumbnail,is_open,hours_breakfast,hours_lunch,hours_dinner,rating,reviews_count) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',
    ['m2','Shree Krishna Tiffin',null,'Karve Nagar, Pune','+91 99887 76655',
     'https://images.unsplash.com/photo-1589302168068-964664d93cb0?q=80&w=400&auto=format&fit=crop',
     1,'7:30 AM - 10:30 AM','12:30 PM - 3:30 PM','7:30 PM - 10:30 PM',4.2,85]);

  // ── Menu Items ─────────────────────────────────────────
  const menuItems = [
    ['m1-b1','m1','Poha',30,'breakfast','veg',1],
    ['m1-b2','m1','Upma',25,'breakfast','veg',1],
    ['m1-b3','m1','Tea',10,'breakfast','veg',1],
    ['m1-l1','m1','Dal Rice',60,'lunch','veg',1],
    ['m1-l2','m1','Chapati Sabji',50,'lunch','veg',1],
    ['m1-l3','m1','Special Thali',80,'lunch','veg',1],
    ['m1-l4','m1','Buttermilk',15,'lunch','veg',1],
    ['m1-d1','m1','Roti Sabji',55,'dinner','veg',1],
    ['m1-d2','m1','Rice Dal Fry',50,'dinner','veg',1],
    ['m2-l1','m2','Veg Thali',70,'lunch','veg',1],
  ];
  for (const item of menuItems) {
    await query('INSERT INTO menu_items (id,mess_id,name,price,meal_type,food_type,is_available) VALUES ($1,$2,$3,$4,$5,$6,$7)', item);
  }

  // ── Slots ──────────────────────────────────────────────
  const slots = [
    ['m1','breakfast','8:00 AM',15,0],
    ['m1','breakfast','9:00 AM',15,0],
    ['m1','lunch','12:00 PM',15,0],
    ['m1','lunch','12:30 PM',15,0],
    ['m1','lunch','1:00 PM',15,0],
    ['m1','lunch','1:30 PM',15,0],
    ['m1','lunch','2:00 PM',15,0],
    ['m1','dinner','7:30 PM',15,0],
    ['m1','dinner','8:00 PM',15,0],
    ['m2','lunch','12:30 PM',10,0],
  ];
  for (const s of slots) {
    await query('INSERT INTO slots (mess_id,meal_type,time,capacity,booked) VALUES ($1,$2,$3,$4,$5)', s);
  }

  // ── Plans ──────────────────────────────────────────────
  await query('INSERT INTO plans (id,mess_id,name,price,total_meals,meal_types,is_recommended) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    ['p1','m1','Bronze Pass',1500,30,'Lunch',0]);
  await query('INSERT INTO plans (id,mess_id,name,price,total_meals,meal_types,is_recommended) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    ['p2','m1','Silver Pass',2500,45,'Lunch,Dinner',0]);
  await query('INSERT INTO plans (id,mess_id,name,price,total_meals,meal_types,is_recommended) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    ['p3','m1','Gold Pass',4000,60,'Breakfast,Lunch,Dinner',1]);

  // ── Subscriptions (all expire 20 days from today) ──────
  const subs = [
    [1,'m1','p3',18,60,0,3,'active',daysAgo(10),daysFromNow(20)],
    [3,'m1','p2',5, 45,0,3,'active',daysAgo(10),daysFromNow(20)],
    [4,'m1','p3',22,60,0,3,'active',daysAgo(10),daysFromNow(20)],
    [5,'m1','p1',0, 30,0,3,'active',daysAgo(10),daysFromNow(20)],
    [6,'m1','p3',15,60,0,3,'active',daysAgo(10),daysFromNow(20)],
    [7,'m1','p2',40,45,0,3,'active',daysAgo(10),daysFromNow(20)],
  ];
  for (const s of subs) {
    await query('INSERT INTO subscriptions (user_id,mess_id,plan_id,meals_remaining,total_meals,no_show_count,max_no_shows,status,starts_at,expires_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)', s);
  }

  // ── Orders (last 14 days) ──────────────────────────────
  const menuChoices = [
    {id:'m1-l1',name:'Dal Rice',price:60},
    {id:'m1-l2',name:'Chapati Sabji',price:50},
    {id:'m1-l3',name:'Special Thali',price:80},
    {id:'m1-d1',name:'Roti Sabji',price:55},
    {id:'m1-d2',name:'Rice Dal Fry',price:50},
    {id:'m1-b1',name:'Poha',price:30},
  ];
  const students   = [1,3,4,6,7];
  const subIds     = [1,2,3,5,6];
  const statuses   = ['Completed','Completed','Completed','Completed','Completed','Completed','No-show','Completed'];
  const orderTypes = ['Dine-in','Parcel'];
  const mealTypes  = ['Lunch','Lunch','Dinner','Lunch','Breakfast','Dinner'];
  const slotTimes  = ['12:00 PM','12:30 PM','1:00 PM','7:30 PM','8:00 AM','8:00 PM'];

  for (let d = 1; d <= 14; d++) {
    const orderCount = d % 3 === 0 ? 2 : 1;
    for (let j = 0; j < orderCount; j++) {
      const idx   = (d + j) % students.length;
      const uid   = students[idx];
      const sid   = subIds[idx];
      const oid   = `MM-${1000 + d * 10 + j}`;
      const mi    = menuChoices[(d + j) % menuChoices.length];
      const mi2   = menuChoices[(d + j + 1) % menuChoices.length];
      const total = mi.price + mi2.price;
      const st    = statuses[(d + j) % statuses.length];
      const ot    = orderTypes[(d + j) % orderTypes.length];
      const mt    = mealTypes[(d + j) % mealTypes.length];
      const sl    = slotTimes[(d + j) % slotTimes.length];
      const ts    = tsAgo(d, 10 + (d % 6), j * 15);

      await query(
        'INSERT INTO orders (id,user_id,mess_id,subscription_id,meal_type,slot_time,order_type,total,status,payment_method,notes,estimated_ready_time,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',
        [oid, uid, 'm1', sid, mt, sl, ot, total, st, 'Subscription', '', `~${sl}`, ts]
      );
      await query('INSERT INTO order_items (order_id,menu_item_id,name,quantity,price) VALUES ($1,$2,$3,$4,$5)',
        [oid, mi.id, mi.name, 1, mi.price]);
      await query('INSERT INTO order_items (order_id,menu_item_id,name,quantity,price) VALUES ($1,$2,$3,$4,$5)',
        [oid, mi2.id, mi2.name, 1, mi2.price]);

      if (st === 'Completed' || st === 'No-show') {
        await query('INSERT INTO attendance (user_id,subscription_id,order_id,date,status) VALUES ($1,$2,$3,$4,$5)',
          [uid, sid, oid, daysAgo(d), st === 'Completed' ? 'attended' : 'no-show']);
      }
    }
  }

  // ── Reviews ────────────────────────────────────────────
  const reviews = [
    [1,'MM-1010','m1-l1','m1',5,'Amazing dal rice!'],
    [3,'MM-1020','m1-l2','m1',4,'Good chapati, could be hotter.'],
    [4,'MM-1030','m1-l3','m1',5,'Best thali in Pune!'],
    [6,'MM-1050','m1-d1','m1',4,'Nice roti sabji.'],
    [7,'MM-1060','m1-d2','m1',3,'Dal fry was average today.'],
    [1,'MM-1070','m1-b1','m1',5,'Love the poha here!'],
    [3,'MM-1080','m1-l1','m1',4,'Consistent quality.'],
    [4,'MM-1090','m1-l3','m1',5,'Special thali is value for money.'],
  ];
  for (const r of reviews) {
    await query('INSERT INTO reviews (user_id,order_id,menu_item_id,mess_id,rating,comment,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [...r, tsAgo(Math.floor(Math.random() * 14) + 1)]);
  }

  const { rows: ratingRows } = await query(
    'SELECT ROUND(AVG(rating)::numeric,1) as avg, COUNT(*) as cnt FROM reviews WHERE mess_id = $1', ['m1']
  );
  await query('UPDATE messes SET rating=$1, reviews_count=$2 WHERE id=$3',
    [ratingRows[0].avg, Number(ratingRows[0].cnt), 'm1']);

  // ── Notifications ──────────────────────────────────────
  await query('INSERT INTO notifications (user_id,type,message,is_read) VALUES ($1,$2,$3,$4)',
    [1,'success','Welcome to MessMate! Your account is ready.',0]);
  await query('INSERT INTO notifications (user_id,type,message,is_read) VALUES ($1,$2,$3,$4)',
    [1,'warning','Your subscription expires in 20 days. Plan ahead!',0]);

  console.log('✅ Seed complete.');
};
