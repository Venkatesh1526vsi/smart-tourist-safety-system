// Seed data for user profiles
const seedProfiles = async (UserModel) => {
  try {
    // Get existing users
    const users = await UserModel.find();
    
    if (users.length === 0) {
      console.log('No users found to seed profiles');
      return;
    }

    // Update users with profile information
    const updates = [];

    // Update first user (tourist/regular user)
    if (users[0]) {
      updates.push(
        UserModel.findByIdAndUpdate(users[0]._id, {
          $set: {
            phone: '9876543210',
            bio: 'Solo traveler exploring India. Love adventure and meeting new people.',
            profile_picture: 'https://api.placeholder.com/150x150?text=Tourist1',
            availability_status: 'available',
            emergency_contacts: [
              {
                name: 'Rajesh Sharma',
                relationship: 'parent',
                phone: '9123456789',
                email: 'rajesh@example.com',
                is_primary: true
              },
              {
                name: 'Priya Sharma',
                relationship: 'sibling',
                phone: '9876543211',
                email: 'priya@example.com',
                is_primary: false
              }
            ],
            preferences: {
              language: 'en',
              notifications: {
                email_alerts: true,
                sms_alerts: true,
                push_notifications: true
              },
              privacy: {
                show_profile: true,
                allow_location_sharing: false,
                allow_contact_sharing: false
              },
              safety: {
                emergency_mode_enabled: false,
                trusted_contacts_only: false,
                sos_enabled: true
              }
            },
            updated_at: new Date()
          }
        })
      );
    }

    // Update second user if exists
    if (users[1]) {
      updates.push(
        UserModel.findByIdAndUpdate(users[1]._id, {
          $set: {
            phone: '9876543212',
            bio: 'Safety officer helping tourists. Always available for assistance.',
            profile_picture: 'https://api.placeholder.com/150x150?text=Officer1',
            availability_status: 'available',
            emergency_contacts: [
              {
                name: 'Police Headquarters',
                relationship: 'work',
                phone: '9811223344',
                email: 'police@example.com',
                is_primary: true
              }
            ],
            preferences: {
              language: 'en',
              notifications: {
                email_alerts: true,
                sms_alerts: true,
                push_notifications: true
              },
              privacy: {
                show_profile: true,
                allow_location_sharing: true,
                allow_contact_sharing: true
              },
              safety: {
                emergency_mode_enabled: true,
                trusted_contacts_only: false,
                sos_enabled: true
              }
            },
            updated_at: new Date()
          }
        })
      );
    }

    // Update additional users with varied profiles
    for (let i = 2; i < Math.min(users.length, 5); i++) {
      const phoneNum = `987654${3200 + i}`;
      const names = ['Amit Patel', 'Neha Gupta', 'Vikram Singh'];
      const bios = [
        'Business traveler in Pune for 2 weeks',
        'Backpacker on a 3-month India tour',
        'Family vacation planning to visit hill stations'
      ];

      updates.push(
        UserModel.findByIdAndUpdate(users[i]._id, {
          $set: {
            phone: phoneNum,
            bio: bios[i - 2] || 'Tourist exploring India',
            profile_picture: `https://api.placeholder.com/150x150?text=User${i + 1}`,
            availability_status: 'available',
            emergency_contacts: [
              {
                name: names[i - 2] || `Contact ${i}`,
                relationship: 'friend',
                phone: `912345${6789 + i}`,
                email: `contact${i}@example.com`,
                is_primary: true
              }
            ],
            preferences: {
              language: i % 2 === 0 ? 'en' : 'hi',
              notifications: {
                email_alerts: true,
                sms_alerts: true,
                push_notifications: true
              },
              privacy: {
                show_profile: true,
                allow_location_sharing: i % 2 === 0,
                allow_contact_sharing: false
              },
              safety: {
                emergency_mode_enabled: false,
                trusted_contacts_only: false,
                sos_enabled: true
              }
            },
            updated_at: new Date()
          }
        })
      );
    }

    await Promise.all(updates);
    console.log(`Successfully seeded profiles for ${updates.length} users`);

  } catch (error) {
    console.error('Error seeding profiles:', error);
  }
};

module.exports = { seedProfiles };
