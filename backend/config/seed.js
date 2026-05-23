/**
 * seed.js — Rich seed data for MessMate.
 * Called from db.js when the users table is empty.
 */
const bcrypt = require('bcryptjs');

// Helper for relative timestamps
function datetime(offset, unit) {
  const now = new Date();
  switch (unit) {
    case 'minutes': now.setMinutes(now.getMinutes() + offset); break;
    case 'hours': now.setHours(now.getHours() + offset); break;
    case 'days': now.setDate(now.getDate() + offset); break;
  }
  return now.toISOString();
}

function daysAgo(d) { return datetime(-d, 'days').split('T')[0]; }

module.exports = function seed(db) {
  console.log('🌱 Seeding database with initial data...');
  const salt = bcrypt.genSaltSync(10);
  const sp = bcrypt.hashSync('student123', salt);
  const ap = bcrypt.hashSync('admin123', salt);

  const insU = db.prepare('INSERT INTO users (name,email,password,phone,college,role,mess_id) VALUES (?,?,?,?,?,?,?)');
  insU.run('Abhijeet Kumar','abhijeet@example.com',sp,'+91 98765 43210','MIT Pune','student','m1');
  insU.run('Rahul Owner','owner@annapurna.com',ap,'+91 99887 76655',null,'admin','m1');
  insU.run('Rohan Sharma','rohan@example.com',sp,'+91 91111 22222','MIT Pune','student','m1');
  insU.run('Priya Patel','priya@example.com',sp,'+91 93333 44444','MIT Pune','student','m1');
  insU.run('Amit Kumar','amit@example.com',sp,'+91 95555 66666','MIT Pune','student','m1');
  insU.run('Sneha Rao','sneha@example.com',sp,'+91 97777 88888','MIT Pune','student','m1');
  insU.run('Kavita Deshmukh','kavita@example.com',sp,'+91 90000 11111','MIT Pune','student','m1');

  // --- Messes ---
  const insM = db.prepare('INSERT INTO messes (id,name,owner_id,location,contact,thumbnail,is_open,hours_breakfast,hours_lunch,hours_dinner,rating,reviews_count) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
  insM.run('m1','Annapurna Mess',2,'Near MIT College, Kothrud, Pune','+91 98765 43210',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop',
    1,'7:00 AM - 10:00 AM','12:00 PM - 3:00 PM','7:00 PM - 10:00 PM',4.5,120);
  insM.run('m2','Shree Krishna Tiffin',null,'Karve Nagar, Pune','+91 99887 76655',
    'https://images.unsplash.com/photo-1589302168068-964664d93cb0?q=80&w=400&auto=format&fit=crop',
    1,'7:30 AM - 10:30 AM','12:30 PM - 3:30 PM','7:30 PM - 10:30 PM',4.2,85);
  insM.run('m3','Maa Ki Rasoi',null,'FC Road, Pune','+91 91234 56789',
    'https://images.unsplash.com/photo-1543362906-acfc16c67564?q=80&w=400&auto=format&fit=crop',
    0,'8:00 AM - 11:00 AM','1:00 PM - 4:00 PM','8:00 PM - 11:00 PM',3.9,42);

  // --- Menu Items ---
  const insI = db.prepare('INSERT INTO menu_items (id,mess_id,name,price,meal_type,food_type,is_available) VALUES (?,?,?,?,?,?,?)');
  insI.run('m1-b1','m1','Poha',30,'breakfast','veg',1);
  insI.run('m1-b2','m1','Upma',25,'breakfast','veg',1);
  insI.run('m1-b3','m1','Tea',10,'breakfast','veg',1);
  insI.run('m1-b4','m1','Idli Sambar',40,'breakfast','veg',0);
  insI.run('m1-l1','m1','Dal Rice',60,'lunch','veg',1);
  insI.run('m1-l2','m1','Chapati Sabji',50,'lunch','veg',1);
  insI.run('m1-l3','m1','Special Thali',80,'lunch','veg',1);
  insI.run('m1-l4','m1','Buttermilk',15,'lunch','veg',1);
  insI.run('m1-d1','m1','Roti Sabji',55,'dinner','veg',1);
  insI.run('m1-d2','m1','Rice Dal Fry',50,'dinner','veg',1);
  insI.run('m2-b1','m2','Misal Pav',50,'breakfast','veg',1);
  insI.run('m2-l1','m2','Veg Thali',70,'lunch','veg',1);
  insI.run('m2-d1','m2','Mini Thali',60,'dinner','veg',1);

  // --- Slots ---
  const insS = db.prepare('INSERT INTO slots (mess_id,meal_type,time,capacity,booked) VALUES (?,?,?,?,?)');
  insS.run('m1','breakfast','8:00 AM',15,4);
  insS.run('m1','breakfast','9:00 AM',15,2);
  insS.run('m1','lunch','12:00 PM',15,8);
  insS.run('m1','lunch','12:30 PM',15,15);
  insS.run('m1','lunch','1:00 PM',15,3);
  insS.run('m1','lunch','1:30 PM',15,0);
  insS.run('m1','lunch','2:00 PM',15,0);
  insS.run('m1','dinner','7:30 PM',15,5);
  insS.run('m1','dinner','8:00 PM',15,3);
  insS.run('m2','lunch','12:30 PM',10,5);
  insS.run('m2','lunch','1:00 PM',10,2);

  // --- Plans (Gold/Silver/Bronze to match frontend) ---
  const insP = db.prepare('INSERT INTO plans (id,mess_id,name,price,total_meals,meal_types,is_recommended) VALUES (?,?,?,?,?,?,?)');
  insP.run('p1','m1','Bronze Pass',1500,30,'["Lunch"]',0);
  insP.run('p2','m1','Silver Pass',2500,45,'["Lunch","Dinner"]',0);
  insP.run('p3','m1','Gold Pass',4000,60,'["Breakfast","Lunch","Dinner"]',1);

  // --- Subscriptions ---
  // user 1=Abhijeet(Gold,18left), 3=Rohan(Silver,5left), 4=Priya(Gold,22left), 5=Amit(Bronze,0=expired), 6=Sneha(Gold,15left), 7=Kavita(Silver,40left)
  const insSub = db.prepare('INSERT INTO subscriptions (user_id,mess_id,plan_id,meals_remaining,total_meals,no_show_count,max_no_shows,status,starts_at,expires_at) VALUES (?,?,?,?,?,?,?,?,?,?)');
  insSub.run(1,'m1','p3',18,60,1,3,'active','2026-05-01','2026-06-15');
  insSub.run(3,'m1','p2',5,45,0,3,'active','2026-05-01','2026-05-20');
  insSub.run(4,'m1','p3',22,60,1,3,'active','2026-04-20','2026-06-01');
  insSub.run(5,'m1','p1',0,30,4,3,'cancelled','2026-04-01','2026-05-01');
  insSub.run(6,'m1','p3',15,60,0,3,'active','2026-05-05','2026-06-10');
  insSub.run(7,'m1','p2',40,45,0,3,'active','2026-05-10','2026-06-20');

  // --- Orders (30+ spread across last 30 days) ---
  const insO = db.prepare('INSERT INTO orders (id,user_id,mess_id,subscription_id,meal_type,slot_time,order_type,total,status,payment_method,notes,estimated_ready_time,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)');
  const insOI = db.prepare('INSERT INTO order_items (order_id,menu_item_id,name,quantity,price) VALUES (?,?,?,?,?)');

  const menuChoices = [
    {id:'m1-l1',name:'Dal Rice',price:60},{id:'m1-l2',name:'Chapati Sabji',price:50},
    {id:'m1-l3',name:'Special Thali',price:80},{id:'m1-d1',name:'Roti Sabji',price:55},
    {id:'m1-d2',name:'Rice Dal Fry',price:50},{id:'m1-b1',name:'Poha',price:30}
  ];
  const students = [1,3,4,6,7]; // active subscription users
  const subIds  = [1,2,3,5,6];
  const statuses = ['Completed','Completed','Completed','Completed','Completed','Cancelled','No-show','Completed'];
  const types = ['Dine-in','Parcel'];
  const meals = ['Lunch','Lunch','Dinner','Lunch','Breakfast','Dinner'];
  const slots = ['12:00 PM','12:30 PM','1:00 PM','7:30 PM','8:00 AM','8:00 PM'];

  for (let d = 1; d <= 30; d++) {
    const date = daysAgo(d);
    const orderCount = d % 3 === 0 ? 2 : 1; // some days have 2 orders
    for (let j = 0; j < orderCount; j++) {
      const idx = (d + j) % students.length;
      const uid = students[idx];
      const sid = subIds[idx];
      const oid = `MM-${1000 + d * 10 + j}`;
      const mi = menuChoices[(d + j) % menuChoices.length];
      const mi2 = menuChoices[(d + j + 1) % menuChoices.length];
      const total = mi.price + mi2.price;
      const st = statuses[(d + j) % statuses.length];
      const ot = types[(d + j) % types.length];
      const mt = meals[(d + j) % meals.length];
      const sl = slots[(d + j) % slots.length];
      const pm = d % 4 === 0 ? 'UPI' : 'Subscription';
      const ts = `${date}T${10 + (d % 6)}:${(j * 15).toString().padStart(2,'0')}:00Z`;

      insO.run(oid,uid,'m1',pm==='Subscription'?sid:null,mt,sl,ot,total,st,pm,'',`~${sl}`,ts);
      insOI.run(oid,mi.id,mi.name,1,mi.price);
      insOI.run(oid,mi2.id,mi2.name,1,mi2.price);
    }
  }

  // Today's active orders (Placed/Preparing)
  insO.run('MM-1234',1,'m1',1,'Lunch','12:30 PM','Dine-in',110,'Preparing','Subscription','Less spicy','~12:25 PM', new Date().toISOString());
  insOI.run('MM-1234','m1-l1','Dal Rice',1,60);
  insOI.run('MM-1234','m1-l2','Chapati Sabji',1,50);

  insO.run('MM-1235',3,'m1',2,'Lunch','1:00 PM','Parcel',80,'Placed','Subscription','','~1:00 PM', new Date().toISOString());
  insOI.run('MM-1235','m1-l3','Special Thali',1,80);

  insO.run('MM-1236',6,'m1',5,'Dinner','7:30 PM','Dine-in',105,'Accepted','Subscription','','~7:25 PM', new Date().toISOString());
  insOI.run('MM-1236','m1-d1','Roti Sabji',1,55);
  insOI.run('MM-1236','m1-d2','Rice Dal Fry',1,50);

  // --- Payments for UPI orders ---
  const insPay = db.prepare('INSERT INTO payments (order_id,user_id,razorpay_order_id,amount,status,type,created_at) VALUES (?,?,?,?,?,?,?)');
  for (let d = 4; d <= 30; d += 4) {
    const oid = `MM-${1000 + d * 10}`;
    const idx = d % students.length;
    const uid = students[idx];
    const mi = menuChoices[d % menuChoices.length];
    const mi2 = menuChoices[(d+1) % menuChoices.length];
    insPay.run(oid,uid,`order_${oid}`,mi.price+mi2.price,'captured','order',`${daysAgo(d)}T12:00:00Z`);
  }
  // Subscription payments
  insPay.run(null,1,'sub_abhijeet',4000,'captured','subscription',daysAgo(16)+'T09:00:00Z');
  insPay.run(null,3,'sub_rohan',2500,'captured','subscription',daysAgo(16)+'T10:00:00Z');
  insPay.run(null,4,'sub_priya',4000,'captured','subscription',daysAgo(27)+'T09:00:00Z');
  insPay.run(null,6,'sub_sneha',4000,'captured','subscription',daysAgo(12)+'T11:00:00Z');
  insPay.run(null,7,'sub_kavita',2500,'captured','subscription',daysAgo(7)+'T09:30:00Z');
  insPay.run(null,5,'sub_amit_failed',1500,'failed','subscription',daysAgo(20)+'T14:00:00Z');

  // --- Attendance records for completed/no-show orders ---
  const insA = db.prepare('INSERT INTO attendance (user_id,subscription_id,order_id,date,status) VALUES (?,?,?,?,?)');
  for (let d = 1; d <= 30; d++) {
    const orderCount = d % 3 === 0 ? 2 : 1;
    for (let j = 0; j < orderCount; j++) {
      const idx = (d + j) % students.length;
      const uid = students[idx];
      const sid = subIds[idx];
      const oid = `MM-${1000 + d * 10 + j}`;
      const st = statuses[(d + j) % statuses.length];
      if (st === 'Completed') insA.run(uid,sid,oid,daysAgo(d),'attended');
      else if (st === 'No-show') insA.run(uid,sid,oid,daysAgo(d),'no-show');
    }
  }

  // --- Reviews ---
  const insR = db.prepare('INSERT INTO reviews (user_id,order_id,menu_item_id,mess_id,rating,comment,created_at) VALUES (?,?,?,?,?,?,?)');
  insR.run(1,'MM-1010','m1-l1','m1',5,'Amazing dal rice!',daysAgo(1)+'T13:00:00Z');
  insR.run(3,'MM-1020','m1-l2','m1',4,'Good chapati, could be hotter.',daysAgo(2)+'T13:30:00Z');
  insR.run(4,'MM-1030','m1-l3','m1',5,'Best thali in Pune!',daysAgo(3)+'T14:00:00Z');
  insR.run(6,'MM-1050','m1-d1','m1',4,'Nice roti sabji.',daysAgo(5)+'T20:00:00Z');
  insR.run(7,'MM-1060','m1-d2','m1',3,'Dal fry was average today.',daysAgo(6)+'T20:30:00Z');
  insR.run(1,'MM-1070','m1-b1','m1',5,'Love the poha here!',daysAgo(7)+'T09:00:00Z');
  insR.run(3,'MM-1080','m1-l1','m1',4,'Consistent quality.',daysAgo(8)+'T13:00:00Z');
  insR.run(4,'MM-1090','m1-l3','m1',5,'Special thali is value for money.',daysAgo(9)+'T14:00:00Z');

  // --- Notifications ---
  const insN = db.prepare('INSERT INTO notifications (user_id,type,message,is_read,created_at) VALUES (?,?,?,?,?)');
  insN.run(1,'success','Your order #MM-1234 was accepted by Annapurna Mess',0,datetime(-2,'minutes'));
  insN.run(1,'success','Your food is ready for pickup!',0,datetime(-15,'minutes'));
  insN.run(1,'warning','Your subscription expires in 5 days. Renew now.',1,datetime(-2,'hours'));
  insN.run(1,'error','No-show detected. 1 meal deducted from your plan.',1,datetime(-1,'days'));
  insN.run(1,'info','New mess added near you: Maa Ki Rasoi',1,datetime(-2,'days'));
  insN.run(3,'success','Your order #MM-1235 has been placed at Annapurna Mess',0,datetime(-5,'minutes'));
  insN.run(6,'success','Your order #MM-1236 has been placed at Annapurna Mess',0,datetime(-3,'minutes'));

  // Update mess rating from reviews
  const stats = db.prepare('SELECT AVG(rating) as avg, COUNT(*) as cnt FROM reviews WHERE mess_id = ?').get('m1');
  db.prepare('UPDATE messes SET rating = ROUND(?, 1), reviews_count = ? WHERE id = ?').run(stats.avg, stats.cnt, 'm1');

  console.log('✅ Seed data loaded successfully.\n');
};
