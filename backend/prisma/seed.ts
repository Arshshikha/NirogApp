import { PrismaClient, UserRole, BloodGroup, MedicalCategory, ProviderType, ContentType, CourseLevel, ContentStatus, DayOfWeek, AppointmentType, BookingStatus, PaymentStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database v2.0...');

  // Clean existing tables (in order of dependencies)
  await prisma.refund.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.payout.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.chatMessageAttachment.deleteMany({});
  await prisma.chatMessage.deleteMany({});
  await prisma.conversationMember.deleteMany({});
  await prisma.conversation.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.providerService.deleteMany({});
  await prisma.providerAddress.deleteMany({});
  await prisma.providerProfile.deleteMany({});
  await prisma.studentProfile.deleteMany({});
  await prisma.doctorAvailabilityOverride.deleteMany({});
  await prisma.doctorAvailabilitySlot.deleteMany({});
  await prisma.doctorProfile.deleteMany({});
  await prisma.patientProfile.deleteMany({});
  await prisma.userProfile.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.content.deleteMany({});

  // 1. Seed Patients
  const patientUser = await prisma.user.create({
    data: {
      email: 'patient@nirog.com',
      passwordHash: 'patient123',
      role: UserRole.PATIENT,
      profile: {
        create: {
          firstName: 'John',
          lastName: 'Doe',
          phone: '+91 98765 43210',
          bio: 'General wellness checkup patient',
          address: {
            create: {
              line1: 'Indirapuram',
              city: 'Ghaziabad',
              state: 'UP',
              pincode: '201014',
            }
          }
        }
      },
      patientProfile: {
        create: {
          bloodGroup: BloodGroup.O_POSITIVE,
        }
      }
    }
  });

  // 2. Seed Doctors
  const doctorUser1 = await prisma.user.create({
    data: {
      email: 'doctor@nirog.com',
      passwordHash: 'doctor123',
      role: UserRole.DOCTOR,
      profile: {
        create: {
          firstName: 'Arpan',
          lastName: 'Sharma',
          phone: '+91 99999 88888',
          address: {
            create: {
              line1: 'Sector 62',
              city: 'Noida',
              state: 'UP',
              pincode: '201301',
            }
          }
        }
      },
      doctorProfile: {
        create: {
          registrationNumber: 'REG-CARD-12345',
          category: MedicalCategory.ALLOPATHY,
          specialties: ['Cardiologist'],
          experience: 12,
          consultationFee: 500.00,
          onlineConsultFee: 500.00,
          avgRating: 4.9,
          totalReviews: 120,
          availabilitySlots: {
            create: [
              {
                dayOfWeek: DayOfWeek.MONDAY,
                startTime: '10:00',
                endTime: '11:00',
                appointmentType: AppointmentType.ONLINE_VIDEO,
                effectiveFrom: new Date(),
              },
              {
                dayOfWeek: DayOfWeek.WEDNESDAY,
                startTime: '12:00',
                endTime: '13:00',
                appointmentType: AppointmentType.ONLINE_VIDEO,
                effectiveFrom: new Date(),
              }
            ]
          }
        }
      }
    },
    include: {
      doctorProfile: true
    }
  });

  const doctorUser2 = await prisma.user.create({
    data: {
      email: 'priya@nirog.com',
      passwordHash: 'doctor123',
      role: UserRole.DOCTOR,
      profile: {
        create: {
          firstName: 'Priya',
          lastName: 'Nair',
          phone: '+91 99999 77777',
          address: {
            create: {
              line1: 'Indirapuram',
              city: 'Ghaziabad',
              state: 'UP',
              pincode: '201014',
            }
          }
        }
      },
      doctorProfile: {
        create: {
          registrationNumber: 'REG-GP-98765',
          category: MedicalCategory.ALLOPATHY,
          specialties: ['General Physician'],
          experience: 8,
          consultationFee: 300.00,
          onlineConsultFee: 300.00,
          avgRating: 4.8,
          totalReviews: 80,
          availabilitySlots: {
            create: [
              {
                dayOfWeek: DayOfWeek.TUESDAY,
                startTime: '09:00',
                endTime: '10:00',
                appointmentType: AppointmentType.IN_PERSON,
                effectiveFrom: new Date(),
              }
            ]
          }
        }
      }
    }
  });

  const doctorUser3 = await prisma.user.create({
    data: {
      email: 'rajesh@nirog.com',
      passwordHash: 'doctor123',
      role: UserRole.DOCTOR,
      profile: {
        create: {
          firstName: 'Rajesh',
          lastName: 'Kumar',
          phone: '+91 99999 66666',
          address: {
            create: {
              line1: 'Sector 15',
              city: 'Noida',
              state: 'UP',
              pincode: '201301',
            }
          }
        }
      },
      doctorProfile: {
        create: {
          registrationNumber: 'REG-AYUR-11223',
          category: MedicalCategory.AYURVEDA,
          specialties: ['Ayurvedic Expert'],
          experience: 15,
          consultationFee: 400.00,
          onlineConsultFee: 400.00,
          avgRating: 4.7,
          totalReviews: 95,
          availabilitySlots: {
            create: [
              {
                dayOfWeek: DayOfWeek.THURSDAY,
                startTime: '11:00',
                endTime: '12:00',
                appointmentType: AppointmentType.IN_PERSON,
                effectiveFrom: new Date(),
              }
            ]
          }
        }
      }
    }
  });

  const doctorUser4 = await prisma.user.create({
    data: {
      email: 'kavita@nirog.com',
      passwordHash: 'doctor123',
      role: UserRole.DOCTOR,
      profile: {
        create: {
          firstName: 'Kavita',
          lastName: 'Rao',
          phone: '+91 99999 55555',
          address: {
            create: {
              line1: 'Sector 22',
              city: 'Noida',
              state: 'UP',
              pincode: '201301',
            }
          }
        }
      },
      doctorProfile: {
        create: {
          registrationNumber: 'REG-HOME-44556',
          category: MedicalCategory.HOMEOPATHY,
          specialties: ['Homeopathic Consultant'],
          experience: 10,
          consultationFee: 350.00,
          onlineConsultFee: 350.00,
          avgRating: 4.6,
          totalReviews: 60,
          availabilitySlots: {
            create: [
              {
                dayOfWeek: DayOfWeek.FRIDAY,
                startTime: '14:00',
                endTime: '15:00',
                appointmentType: AppointmentType.ONLINE_CHAT,
                effectiveFrom: new Date(),
              }
            ]
          }
        }
      }
    }
  });

  // 3. Seed Students
  await prisma.user.create({
    data: {
      email: 'student@nirog.com',
      passwordHash: 'student123',
      role: UserRole.STUDENT,
      profile: {
        create: {
          firstName: 'Rahul',
          lastName: 'Verma',
          phone: '+91 88888 77777',
          address: {
            create: {
              line1: 'Sector 15',
              city: 'Noida',
              state: 'UP',
              pincode: '201301',
            }
          }
        }
      },
      studentProfile: {
        create: {
          institutionName: 'Nirog Medical Institute',
          enrollmentNumber: 'NMI-2024-887',
          courseOfStudy: 'MBBS',
          yearOfStudy: 2,
        }
      }
    }
  });

  // 4. Seed Providers
  const providerUser = await prisma.user.create({
    data: {
      email: 'provider@nirog.com',
      passwordHash: 'provider123',
      role: UserRole.PROVIDER,
      profile: {
        create: {
          firstName: 'Apollo',
          lastName: 'Diagnostics',
          phone: '+91 77777 66666',
        }
      },
      providerProfile: {
        create: {
          providerType: ProviderType.LAB,
          legalName: 'Apollo Diagnostics Lab',
          registrationNumber: 'REG-LAB-556',
          avgRating: 4.8,
          address: {
            create: {
              line1: 'Sector 62',
              city: 'Noida',
              state: 'UP',
              pincode: '201301',
            }
          },
          services: {
            create: [
              { name: 'Blood Test', price: 250.00, durationMinutes: 15, category: 'Pathology' },
              { name: 'Urine Test', price: 150.00, durationMinutes: 10, category: 'Pathology' },
              { name: 'ECG', price: 500.00, durationMinutes: 20, category: 'Cardiology' },
            ]
          }
        }
      }
    }
  });

  const maxUser = await prisma.user.create({
    data: {
      email: 'max@nirog.com',
      passwordHash: 'provider123',
      role: UserRole.PROVIDER,
      profile: {
        create: {
          firstName: 'Max',
          lastName: 'Hospital',
          phone: '+91 77777 55555',
        }
      },
      providerProfile: {
        create: {
          providerType: ProviderType.HOSPITAL,
          legalName: 'Max Super Speciality Hospital',
          registrationNumber: 'REG-HOSP-112',
          avgRating: 4.9,
          address: {
            create: {
              line1: 'Vaishali',
              city: 'Ghaziabad',
              state: 'UP',
              pincode: '201010',
            }
          },
          services: {
            create: [
              { name: 'Emergency', price: 1000.00, durationMinutes: 30, category: 'Emergency' },
              { name: 'ICU', price: 5000.00, durationMinutes: 60, category: 'Critical Care' },
              { name: 'Cardiology', price: 1200.00, durationMinutes: 30, category: 'Cardiology' },
            ]
          }
        }
      }
    }
  });

  const fortisUser = await prisma.user.create({
    data: {
      email: 'fortis@nirog.com',
      passwordHash: 'provider123',
      role: UserRole.PROVIDER,
      profile: {
        create: {
          firstName: 'Fortis',
          lastName: 'Hospital',
          phone: '+91 77777 44444',
        }
      },
      providerProfile: {
        create: {
          providerType: ProviderType.HOSPITAL,
          legalName: 'Fortis Hospital',
          registrationNumber: 'REG-HOSP-113',
          avgRating: 4.8,
          address: {
            create: {
              line1: 'Sector 62',
              city: 'Noida',
              state: 'UP',
              pincode: '201301',
            }
          },
          services: {
            create: [
              { name: 'Emergency', price: 900.00, durationMinutes: 30, category: 'Emergency' },
              { name: 'OPD', price: 500.00, durationMinutes: 15, category: 'General' },
              { name: 'Neurology', price: 1500.00, durationMinutes: 30, category: 'Neurology' },
            ]
          }
        }
      }
    }
  });

  const srlUser = await prisma.user.create({
    data: {
      email: 'srl@nirog.com',
      passwordHash: 'provider123',
      role: UserRole.PROVIDER,
      profile: {
        create: {
          firstName: 'SRL',
          lastName: 'Labs',
          phone: '+91 77777 33333',
        }
      },
      providerProfile: {
        create: {
          providerType: ProviderType.LAB,
          legalName: 'SRL Labs',
          registrationNumber: 'REG-LAB-557',
          avgRating: 4.6,
          address: {
            create: {
              line1: 'Indirapuram',
              city: 'Ghaziabad',
              state: 'UP',
              pincode: '201014',
            }
          },
          services: {
            create: [
              { name: 'Blood Test', price: 300.00, durationMinutes: 15, category: 'Pathology' },
              { name: 'MRI', price: 4000.00, durationMinutes: 45, category: 'Radiology' },
              { name: 'CT Scan', price: 3000.00, durationMinutes: 30, category: 'Radiology' },
            ]
          }
        }
      }
    }
  });

  const pharmacyUser = await prisma.user.create({
    data: {
      email: 'pharmacy@nirog.com',
      passwordHash: 'provider123',
      role: UserRole.PROVIDER,
      profile: {
        create: {
          firstName: 'City',
          lastName: 'Pharmacy',
          phone: '+91 77777 22222',
        }
      },
      providerProfile: {
        create: {
          providerType: ProviderType.PHARMACY,
          legalName: 'City Pharmacy',
          registrationNumber: 'REG-PHARM-889',
          avgRating: 4.5,
          address: {
            create: {
              line1: 'Sector 62',
              city: 'Noida',
              state: 'UP',
              pincode: '201301',
            }
          },
          services: {
            create: [
              { name: 'Home Delivery', price: 50.00, durationMinutes: 60, category: 'Delivery' },
              { name: 'Medicines', price: 100.00, durationMinutes: 10, category: 'Retail' },
            ]
          }
        }
      }
    }
  });

  // 4b. Seed Admin User
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@nirog.com',
      passwordHash: 'admin123',
      role: UserRole.ADMIN,
      profile: {
        create: {
          firstName: 'System',
          lastName: 'Admin',
          phone: '+91 99999 11111',
        }
      },
      adminProfile: {
        create: {
          department: 'Operations',
          permissions: ['SUPER_ADMIN']
        }
      }
    }
  });


  // 5. Seed Hub Content (Blogs & Courses)
  if (doctorUser1.doctorProfile) {
    const blog1 = await prisma.content.create({
      data: {
        authorId: doctorUser1.doctorProfile.id,
        type: ContentType.BLOG,
        status: ContentStatus.PUBLISHED,
        title: '5 Secrets to Maintain a Healthy Heart',
        slug: '5-secrets-to-maintain-a-healthy-heart',
        excerpt: 'Maintaining heart health requires a balance of proper diet, regular exercise, and stress management.',
        body: 'Maintaining heart health requires a balance of proper diet, regular cardiovascular exercise, stress management, and routine checkups. In this blog post, we discuss the role of omega-3 fatty acids, sodium limits, and daily walking routines.',
        likesCount: 142,
        commentsCount: 23,
      }
    });

    const courseContent = await prisma.content.create({
      data: {
        authorId: doctorUser1.doctorProfile.id,
        type: ContentType.COURSE,
        status: ContentStatus.PUBLISHED,
        title: 'Basic First Aid and Emergency Response',
        slug: 'basic-first-aid-and-emergency-response',
        excerpt: 'A comprehensive starter course covering standard first aid techniques, CPR instructions, choking relief.',
        body: 'A comprehensive starter course covering standard first aid techniques, CPR instructions, choking relief for infants and adults, wound dressing, and management of minor burns.',
        likesCount: 420,
        commentsCount: 98,
        course: {
          create: {
            level: CourseLevel.BEGINNER,
            price: 0.0,
            language: 'Hindi',
            totalModules: 1,
            totalLessons: 1,
            estimatedHours: 1.5,
            modules: {
              create: [
                {
                  moduleNumber: 1,
                  title: 'General Anatomy & Physiology',
                  summary: 'A solid understanding of anatomy and physiology is the cornerstone of emergency care.',
                  durationMins: 90,
                  isPremium: false,
                  isPublished: true,
                  objectives: {
                    create: [
                      { objective: 'Understand the major organ systems of the human body', sortOrder: 0 },
                      { objective: 'Identify the role of each system in maintaining homeostasis', sortOrder: 1 },
                    ]
                  },
                  lessons: {
                    create: [
                      {
                        lessonNumber: 1,
                        title: 'Introduction to Anatomy vs. Physiology',
                        body: 'Anatomy is the study of the structure of the body, while physiology focuses on how those structures function. Together, they form the foundation of all medical practice.',
                        durationMins: 30,
                        isPremium: false,
                      }
                    ]
                  },
                  keyTerms: {
                    create: [
                      { term: 'Homeostasis', definition: "The body's ability to maintain stable internal conditions despite external changes." }
                    ]
                  }
                }
              ]
            }
          }
        }
      }
    });
  }

  // 6. Seed Bookings and Payments for Patient
  const patientProfile = await prisma.patientProfile.findUnique({
    where: { userId: patientUser.id }
  });
  const doctorProfile1 = await prisma.doctorProfile.findUnique({
    where: { userId: doctorUser1.id }
  });
  const doctorProfile2 = await prisma.doctorProfile.findUnique({
    where: { userId: doctorUser2.id }
  });

  if (patientProfile && doctorProfile1 && doctorProfile2) {
    console.log('Seeding bookings and payments...');
    
    // Booking 1: Confirmed and Paid
    const booking1 = await prisma.booking.create({
      data: {
        bookingReference: 'NRG-20260715-ARPAN',
        patientId: patientUser.id,
        doctorProfileId: doctorProfile1.id,
        appointmentType: AppointmentType.ONLINE_VIDEO,
        scheduledDate: new Date('2026-07-15T00:00:00Z'),
        scheduledTime: '10:30',
        status: BookingStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID,
        totalFee: 500.00,
        createdAt: new Date('2026-07-15T09:00:00Z'),
      }
    });

    await prisma.payment.create({
      data: {
        bookingId: booking1.id,
        amount: 500.00,
        currency: 'INR',
        method: 'UPI',
        status: PaymentStatus.PAID,
        gatewayName: 'razorpay',
        gatewayOrderId: 'order_arpan_123',
        gatewayPaymentId: 'pay_arpan_123',
        paidAt: new Date('2026-07-15T09:05:00Z'),
        createdAt: new Date('2026-07-15T09:00:00Z'),
      }
    });

    // Booking 2: Pending and Unpaid
    const booking2 = await prisma.booking.create({
      data: {
        bookingReference: 'NRG-20260720-PRIYA',
        patientId: patientUser.id,
        doctorProfileId: doctorProfile2.id,
        appointmentType: AppointmentType.IN_PERSON,
        scheduledDate: new Date('2026-07-20T00:00:00Z'),
        scheduledTime: '11:00',
        status: BookingStatus.PENDING,
        paymentStatus: PaymentStatus.UNPAID,
        totalFee: 300.00,
        createdAt: new Date('2026-07-20T08:00:00Z'),
      }
    });

    await prisma.payment.create({
      data: {
        bookingId: booking2.id,
        amount: 300.00,
        currency: 'INR',
        method: 'CASH',
        status: PaymentStatus.UNPAID,
        gatewayName: 'onsite',
        createdAt: new Date('2026-07-20T08:00:00Z'),
      }
    });

    // Booking 3: Cancelled and Refunded (Priya Nair, 12 July 2026)
    const booking3 = await prisma.booking.create({
      data: {
        bookingReference: 'NRG-20260712-REFUND',
        patientId: patientUser.id,
        doctorProfileId: doctorProfile2.id,
        appointmentType: AppointmentType.ONLINE_CHAT,
        scheduledDate: new Date('2026-07-12T00:00:00Z'),
        scheduledTime: '15:00',
        status: BookingStatus.CANCELLED_BY_PROVIDER,
        paymentStatus: PaymentStatus.REFUNDED,
        totalFee: 300.00,
        createdAt: new Date('2026-07-12T14:00:00Z'),
      }
    });

    const payment3 = await prisma.payment.create({
      data: {
        bookingId: booking3.id,
        amount: 300.00,
        currency: 'INR',
        method: 'UPI',
        status: PaymentStatus.REFUNDED,
        gatewayName: 'razorpay',
        gatewayOrderId: 'order_priya_456',
        gatewayPaymentId: 'pay_priya_456',
        paidAt: new Date('2026-07-12T14:05:00Z'),
        createdAt: new Date('2026-07-12T14:00:00Z'),
      }
    });

    await prisma.refund.create({
      data: {
        paymentId: payment3.id,
        amount: 300.00,
        reason: 'Doctor unavailable',
        status: PaymentStatus.REFUNDED,
        processedAt: new Date('2026-07-12T14:30:00Z'),
        createdAt: new Date('2026-07-12T14:10:00Z'),
      }
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
