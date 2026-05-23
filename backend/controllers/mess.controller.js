const db = require('../config/db');

/**
 * GET /api/mess
 * List all messes
 */
exports.getAllMess = (req, res) => {
  try {
    const messes = db.prepare('SELECT * FROM messes').all();

    const result = messes.map(mess => {
      // Prefer owner-set today's special, fall back to first available lunch item
      let todaysSpecial = mess.todays_special;
      if (!todaysSpecial) {
        const autoSpecial = db.prepare(
          "SELECT name FROM menu_items WHERE mess_id = ? AND meal_type = 'lunch' AND is_available = 1 LIMIT 1"
        ).get(mess.id);
        todaysSpecial = autoSpecial?.name || 'N/A';
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
    });

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
exports.getMessById = (req, res) => {
  try {
    const mess = db.prepare('SELECT * FROM messes WHERE id = ?').get(req.params.id);
    if (!mess) {
      return res.status(404).json({ error: 'Mess not found.' });
    }

    // Get menu grouped by meal type
    const menuItems = db.prepare('SELECT * FROM menu_items WHERE mess_id = ?').all(mess.id);
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
    const allSlots = db.prepare('SELECT * FROM slots WHERE mess_id = ?').all(mess.id);
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
      const autoSpecial = db.prepare(
        "SELECT name FROM menu_items WHERE mess_id = ? AND meal_type = 'lunch' AND is_available = 1 LIMIT 1"
      ).get(mess.id);
      todaysSpecial = autoSpecial?.name || 'N/A';
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
exports.getMenu = (req, res) => {
  try {
    const { id } = req.params;
    const { meal_type } = req.query;

    let query = 'SELECT * FROM menu_items WHERE mess_id = ?';
    const params = [id];

    if (meal_type) {
      query += ' AND meal_type = ?';
      params.push(meal_type);
    }

    const items = db.prepare(query).all(...params);

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
exports.getSlots = (req, res) => {
  try {
    const { id } = req.params;
    const { meal_type } = req.query;

    let query = 'SELECT * FROM slots WHERE mess_id = ?';
    const params = [id];

    if (meal_type) {
      query += ' AND meal_type = ?';
      params.push(meal_type);
    }

    const slots = db.prepare(query).all(...params);

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
exports.getPlans = (req, res) => {
  try {
    const plans = db.prepare('SELECT * FROM plans WHERE mess_id = ?').all(req.params.id);

    const result = plans.map(plan => ({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      meals: plan.total_meals,
      types: JSON.parse(plan.meal_types),
      isRecommended: !!plan.is_recommended
    }));

    res.json(result);
  } catch (err) {
    console.error('getPlans error:', err);
    res.status(500).json({ error: 'Failed to fetch plans.' });
  }
};
