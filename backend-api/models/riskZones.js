// backend-api/models/riskZones.js
const express = require('express');
const router = express.Router();
const RiskZone = require('../models/RiskZone');
const riskZones = [
  {
    name: "Pune City Center",
    description: "Downtown Pune area with high foot traffic",
    riskLevel: "low",
    polygon: [
      [18.520430, 73.856744],
      [18.527260, 73.873600],
      [18.519015, 73.878651],
      [18.512164, 73.870708],
      [18.514892, 73.858779],
      [18.520430, 73.856744]
    ],
    center: {
      latitude: 18.520430,
      longitude: 73.856744
    },
    radius: 2,
    weather_multiplier: 1.2, // Risk increases 20% during rain
    peak_hours: {
      enabled: true,
      start_hour: 18, // 6 PM
      end_hour: 6,    // 6 AM
      multiplier: 1.3
    },
    alert_severity: "low",
    incident_count: 0,
    incident_density: 0
  },
  {
    name: "Sinhagad Fort Perimeter",
    description: "Historical fort area with high altitude and remote location",
    riskLevel: "high",
    polygon: [
      [18.362211, 73.753885],
      [18.357415, 73.756325],
      [18.356250, 73.761740],
      [18.350721, 73.761372],
      [18.351873, 73.753345],
      [18.362211, 73.753885]
    ],
    center: {
      latitude: 18.362211,
      longitude: 73.753885
    },
    radius: 5,
    weather_multiplier: 1.8, // Risk increases 80% during storms due to altitude
    peak_hours: {
      enabled: true,
      start_hour: 17, // 5 PM
      end_hour: 7,    // 7 AM
      multiplier: 2.0
    },
    alert_severity: "high",
    incident_count: 0,
    incident_density: 0
  },
  {
    name: "Pune Airport Vicinity",
    description: "Airport restricted area with security concerns",
    riskLevel: "critical",
    polygon: [
      [18.581340, 73.915822],
      [18.574862, 73.924662],
      [18.562933, 73.920933],
      [18.568829, 73.912275],
      [18.581340, 73.915822]
    ],
    center: {
      latitude: 18.581340,
      longitude: 73.915822
    },
    radius: 3,
    weather_multiplier: 1.1, // Minimal weather impact
    peak_hours: {
      enabled: true,
      start_hour: 6,  // 6 AM
      end_hour: 23,   // 11 PM (entire day due to airport operations)
      multiplier: 2.5
    },
    alert_severity: "critical",
    incident_count: 0,
    incident_density: 0
  }
];

// Function to seed the risk zones collection (for development/testing)
async function seedRiskZones(RiskZoneModel) {
  try {
    await RiskZoneModel.deleteMany(); // Remove all existing entries
    await RiskZoneModel.insertMany(riskZones);
    console.log('Risk zones seeded successfully!');
  } catch (err) {
    console.error('Error seeding risk zones:', err.message);
  }
}

module.exports = { riskZones, seedRiskZones };

// router.get('/', async (req, res) => {
//   try {
//     const zones = await RiskZone.find();
//     res.json(zones);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// module.exports = router;