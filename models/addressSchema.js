const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'//, required: true 
  },
  address:[{
    name: { 
    type: String,
    required: true 
    },
    phone: { 
    type: String, 
    required: true 
    },
    address: { 
    type: String, 
    required: true 
    },
    city: { 
    type: String, 
    required: true 
    },
    state: { 
    type: String, 
    required: true 
    },
    postalCode: { 
    type: String, 
    required: true 
    },
    country: { 
    type: String, 
    required: true 
    }
  }],

});

module.exports = mongoose.model('Address', addressSchema);
