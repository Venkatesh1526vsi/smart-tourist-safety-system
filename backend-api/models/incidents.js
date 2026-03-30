// Seed data for incidents
const seedIncidents = async (IncidentModel, UserModel) => {
  try {
    // Check if data already exists
    const existingCount = await IncidentModel.countDocuments();
    if (existingCount > 0) {
      console.log(`Incidents already seeded (${existingCount} found). Skipping seed.`);
      return;
    }

    // Create sample incidents with realistic data
    const incidents = [
      {
        userId: null, // Will be populated from first user
        type: 'theft',
        description: 'Bag stolen at railway station',
        latitude: 18.535922,
        longitude: 73.847997,
        severity: 'high',
        category: 'theft',
        priority_score: 55,
        status: 'reported',
        witnesses: [
          {
            name: 'Rajesh Kumar',
            contact: '9876543210',
            statement: 'Saw someone run away with red bag'
          }
        ],
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
        updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        userId: null,
        type: 'assault',
        description: 'Tourist assaulted near market area',
        latitude: 18.520430,
        longitude: 73.856744,
        severity: 'critical',
        category: 'assault',
        priority_score: 70,
        status: 'investigating',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000),
        updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
        assigned_at: new Date(Date.now() - 3 * 60 * 60 * 1000)
      },
      {
        userId: null,
        type: 'lost',
        description: 'Tourist lost at Sinhagad Fort, needs assistance',
        latitude: 18.369277,
        longitude: 73.752746,
        severity: 'high',
        category: 'suspicious',
        priority_score: 60,
        status: 'investigating',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
        created_at: new Date(Date.now() - 1 * 60 * 60 * 1000),
        updated_at: new Date(Date.now() - 45 * 60 * 1000),
        assigned_at: new Date(Date.now() - 50 * 60 * 1000)
      },
      {
        userId: null,
        type: 'medical emergency',
        description: 'Medical emergency at airport terminal',
        latitude: 18.579649,
        longitude: 73.919384,
        severity: 'critical',
        category: 'accident',
        priority_score: 75,
        status: 'resolved',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
        created_at: new Date(Date.now() - 8 * 60 * 60 * 1000),
        updated_at: new Date(Date.now() - 3 * 60 * 60 * 1000),
        assigned_at: new Date(Date.now() - 7 * 60 * 60 * 1000),
        resolved_at: new Date(Date.now() - 3 * 60 * 60 * 1000),
        resolution_notes: 'Ambulance arrived and patient transferred to hospital'
      },
      {
        userId: null,
        type: 'theft',
        description: 'Mobile phone stolen from cafe',
        latitude: 18.530278,
        longitude: 73.852917,
        severity: 'medium',
        category: 'theft',
        priority_score: 45,
        status: 'closed',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
        updated_at: new Date(Date.now() - 6 * 60 * 60 * 1000),
        assigned_at: new Date(Date.now() - 22 * 60 * 60 * 1000),
        resolved_at: new Date(Date.now() - 6 * 60 * 60 * 1000),
        resolution_notes: 'Case registered, phone tracking initiated'
      },
      {
        userId: null,
        type: 'other',
        description: 'Suspicious activity reported near tourist area',
        latitude: 18.525694,
        longitude: 73.850417,
        severity: 'medium',
        category: 'suspicious',
        priority_score: 50,
        status: 'reported',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        created_at: new Date(Date.now() - 30 * 60 * 1000),
        updated_at: new Date(Date.now() - 30 * 60 * 1000)
      }
    ];

    // Get first user to assign as reporter
    const users = await UserModel.find().limit(1);
    if (users.length > 0) {
      incidents.forEach(incident => {
        incident.userId = users[0]._id;
      });
    }

    // If we need to assign incidents, get admin user
    const adminUsers = await UserModel.find({ role: 'admin' }).limit(1);
    if (adminUsers.length > 0) {
      // Assign some incidents
      incidents[1].assigned_officer = adminUsers[0]._id; // assault case
      incidents[2].assigned_officer = adminUsers[0]._id; // lost tourist
      incidents[3].resolved_by = adminUsers[0]._id; // medical emergency
      incidents[4].resolved_by = adminUsers[0]._id; // theft case
    }

    // Insert incidents
    const createdIncidents = await IncidentModel.insertMany(incidents);
    console.log(`Successfully seeded ${createdIncidents.length} incidents`);

    return createdIncidents;
  } catch (error) {
    console.error('Error seeding incidents:', error);
  }
};

module.exports = { seedIncidents };
