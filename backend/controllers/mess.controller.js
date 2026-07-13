const { query } = require('../config/db');

/**
 * GET /api/mess
 * List all messes
 */
exports.getAllMess = async (req, res) => {
  try {
    const { rows: messes } = await query('SELECT * FROM messes');

    const result = await Promise.all(messes.map(async mess => {
      // Prefer owner-set today's special, fall back to first available lunch item
      let todaysSpecial = mess.todays_special;
      if (!todaysSpecial) {
        const { rows: autoRows } = await query(
          "SELECT name FROM menu_items WHERE mess_id = $1 AND meal_type = 'lunch' AND is_available = 1 LIMIT 1",
          [mess.id]
        );
        todaysSpecial = autoRows[0]?.name || 'N/A';
      }

      return {
        id: mess.id,
        name: mess.name,
        rating: mess.rating,
        reviewsCount: mess.reviews_count,
        location: mess.location,
        contact: mess.contact,
        isOpen: !!mess.is_open,
        thumbnail: mess.thumbnail,
        todaysSpecial,
        hours: {
          breakfast: mess.hours_breakfast,
          lunch: mess.hours_lunch,
          dinner: mess.hours_dinner
        }
      };
    }));

    res.json(result);
  } catch (err) {
    console.error('getAllMess error:', err);
    res.status(500).json({ error: 'Failed to fetch messes.' });
  }
};

/**
 * GET /api/mess/:id
 * Get full mess detail including menu, slots
 */
exports.getMessById = async (req, res) => {
  try {
    const { rows: messRows } = await query('SELECT * FROM messes WHERE id = $1', [req.params.id]);
    const mess = messRows[0];
    if (!mess) {
      return res.status(404).json({ error: 'Mess not found.' });
    }

    // Get menu grouped by meal type
    const { rows: menuItems } = await query('SELECT * FROM menu_items WHERE mess_id = $1', [mess.id]);
    const menu = { breakfast: [], lunch: [], dinner: [] };
    menuItems.forEach(item => {
      menu[item.meal_type].push({
        id: item.id,
        name: item.name,
        price: item.price,
        isAvailable: !!item.is_available,
        type: item.food_type
      });
    });

    // Get slots grouped by meal type
    const { rows: allSlots } = await query('SELECT * FROM slots WHERE mess_id = $1', [mess.id]);
    const slots = {};
    allSlots.forEach(slot => {
      if (!slots[slot.meal_type]) slots[slot.meal_type] = [];
      slots[slot.meal_type].push({
        time: slot.time,
        capacity: slot.capacity,
        booked: slot.booked
      });
    });

    // Prefer owner-set today's special, fall back to first available lunch item
    let todaysSpecial = mess.todays_special;
    if (!todaysSpecial) {
      const { rows: autoRows } = await query(
        "SELECT name FROM menu_items WHERE mess_id = $1 AND meal_type = 'lunch' AND is_available = 1 LIMIT 1",
        [mess.id]
      );
      todaysSpecial = autoRows[0]?.name || 'N/A';
    }

    res.json({
      id: mess.id,
      name: mess.name,
      rating: mess.rating,
      reviewsCount: mess.reviews_count,
      location: mess.location,
      contact: mess.contact,
      isOpen: !!mess.is_open,
      thumbnail: mess.thumbnail,
      todaysSpecial,
      hours: {
        breakfast: mess.hours_breakfast,
        lunch: mess.hours_lunch,
        dinner: mess.hours_dinner
      },
      menu,
      slots
    });
  } catch (err) {
    console.error('getMessById error:', err);
    res.status(500).json({ error: 'Failed to fetch mess details.' });
  }
};

/**
 * GET /api/mess/:id/menu?meal_type=lunch
 * Get today's menu for a mess, optionally filtered by meal type
 */
exports.getMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const { meal_type } = req.query;

    let sql = 'SELECT * FROM menu_items WHERE mess_id = $1';
    const params = [id];

    if (meal_type) {
      sql += ' AND meal_type = $2';
      params.push(meal_type);
    }

    const { rows: items } = await query(sql, params);

    const result = items.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      isAvailable: !!item.is_available,
      type: item.food_type,
      mealType: item.meal_type
    }));

    res.json(result);
  } catch (err) {
    console.error('getMenu error:', err);
    res.status(500).json({ error: 'Failed to fetch menu.' });
  }
};

/**
 * GET /api/mess/:id/slots?meal_type=lunch
 * Get available slots for a mess
 */
exports.getSlots = async (req, res) => {
  try {
    const { id } = req.params;
    const { meal_type } = req.query;

    let sql = 'SELECT * FROM slots WHERE mess_id = $1';
    const params = [id];

    if (meal_type) {
      sql += ' AND meal_type = $2';
      params.push(meal_type);
    }

    const { rows: slots } = await query(sql, params);

    const result = slots.map(slot => ({
      id: slot.id,
      time: slot.time,
      capacity: slot.capacity,
      booked: slot.booked,
      mealType: slot.meal_type
    }));

    res.json(result);
  } catch (err) {
    console.error('getSlots error:', err);
    res.status(500).json({ error: 'Failed to fetch slots.' });
  }
};

/**
 * GET /api/mess/:id/plans
 * Get subscription plans for a mess
 */
exports.getPlans = async (req, res) => {
  try {
    const { rows: plans } = await query('SELECT * FROM plans WHERE mess_id = $1', [req.params.id]);

    const result = plans.map(plan => ({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      meals: plan.total_meals,
      types: plan.meal_types ? plan.meal_types.split(',') : [],
      isRecommended: !!plan.is_recommended
    }));

    res.json(result);
  } catch (err) {
    console.error('getPlans error:', err);
    res.status(500).json({ error: 'Failed to fetch plans.' });
  }
};
