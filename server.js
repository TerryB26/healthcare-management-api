const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

const PORT = process.env.PORT || 3000;

const allowedOrigins = ['http://localhost:2663', 'http://localhost:4200','http://localhost:3000' , 'https://hms-d17f3a934404.herokuapp.com']; // Add your allowed origins here

// Configure CORS
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      var msg = 'The CORS policy for this site does not ' +
                'allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));



// Middleware
app.use(bodyParser.json());

// Use express.json() middleware to parse JSON bodies
app.use(express.json());

function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    
  };

  const secret = 'kamopmkwanazi17';
  const options = {
    expiresIn: '1h',
  };

  return jwt.sign(payload, secret, options);
}

//database connection
const db = mysql.createConnection({
  host: 'k2fqe1if4c7uowsh.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
  user: 'pyvw5iwbi9ff9kap',
  password: 'kf213d07vhz5pq5g',
  port: 3306,
  database: 'p6jlx4wtdk7uzuqd',
});

// ===================================================================================
// ===================================================================================

// Send email
app.post('/api/send-email', (req, res) => {
  const { recipient, subject, message } = req.body;

  // Create a transporter object using nodemailer
  var transport = nodemailer.createTransport({
    host: "live.smtp.mailtrap.io",
    port: 587,
    auth: {
      user: "api",
      pass: "b7749eee68ddad9977acd542aa47be3c"
    }
  });

  // Define the email options
  const mailOptions = {
    from: 'info@demomailtrap.com',
    to: "terryb6326@gmail.com",
    subject: subject,
    text: message
  };

  // Send the email
  transport.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      return res.status(500).json({ message: 'Failed to send email' });
    } else {
      console.log('Email sent: ' + info.response);
      return res.json({ message: 'Email sent successfully' });
    }
  });
});



// ===================================================================================
// =========================Get Data Only!!!!======================================= 

app.get('/', (re,res) => {
  return res.json('Hello from server')
})

//get all departments
app.get('/api/hospital-departments', (req, res) => {
  const sql = 'SELECT * FROM dpartments';
  db.query(sql, (err, result) => {
    if(err) throw err;
    return res.json(result);
  })
})

//get a departments and their wards
app.get('/api/department-details/:id', (req, res) => {
  const id = req.params.id;

  const sql = 'SELECT d.department_name, d.department_description, '+
  'd.department_email, d.department_phone , w.ward_name,'+
  ' w.ward_description, w.ward_capacity FROM wards w '+
  'join dpartments d '+
  'on w.department_id = d.department_id '+
  'where d.department_id = ' + id;

  db.query(sql, (err, result) => {
    if(err) throw err;
    return res.json(result);
  })
})

//get all departments and their wards
app.get('/api/department-wards', (req, res) => {
  const id = req.params.id;

  const sql = 'SELECT w.ward_id, d.department_name, '+
  'w.ward_name '+
  'FROM wards w '+
  'join dpartments d '+
  'on w.department_id = d.department_id ';

  db.query(sql, (err, result) => {
    if(err) throw err;
    return res.json(result);
  })
})

//get all wards
app.get('/api/hospital-wards', (req, res) => {
  const sql = 'SELECT * FROM wards';
  db.query(sql, (err, result) => {
    if(err) throw err;
    return res.json(result);
  })
})

//get att conditions
app.get('/api/health-conditions', (req, res) => {
  const sql = 'SELECT * FROM health_conditions';
  db.query(sql, (err, result) => {
    if(err) throw err;
    return res.json(result);
  })
})

//get all roles
app.get('/api/user-roles', (req, res) => {
  const sql = 'SELECT * FROM roles';
  db.query(sql, (err, result) => {
    if(err) throw err;
    return res.json(result);
  })
})

//get all users and their roles
app.get('/api/user-details', (req, res) => {

  const sql = 'SELECT s.user_id, s.user_name, s.user_surname, s.user_email, s.user_password, r.role_name ,s.is_verified FROM users s ' +
  'Join roles r '+
  'ON s.role_id = r.role_id';

  db.query(sql, (err, result) => {
    if(err) throw err;
    return res.json(result);
  })
})


//==============================================================================
//==============================================================================
//Auth
// Login

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  // Check if the email and password are provided
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  // Query the database to find the user with the provided email
  // const sql = 'SELECT u.*, r.role_name FROM users u join roles r on r.role_id = u.role_id WHERE user_email = ?';
  const sql = 'select u.*, r.role_name, n.nurse_license_number, n.nurse_ward_id, d.doctor_license_number, d.doctor_ward_id from users u '+
  'join roles r '+
  'on u.role_id = r.role_id '+
  'left join nurses n '+
  'on n.user_id = u.user_id '+
  'left join doctors d '+
  'on d.user_id = u.user_id '+
  'where u.user_email = ?';
  db.query(sql, [email], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Internal server error' });
    }

    // Check if the user exists
    if (result.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = result[0];

    // Check if the password is correct
    if (user.user_password !== password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user);

    // Return the user information and token
    return res.status(200).json({ user, token });
  });
});


// ============================================================================
// ========================Get Users!!!!======================================= 



//Get All Nurses
app.get('/api/nurses', (req, res) => {
  let sql = 'SELECT u.user_id, u.user_reference, n.nurse_id, u.user_name, u.user_surname, u.user_email, r.role_name, n.nurse_license_number, n.nurse_ward_id, w.ward_name from nurses n ' +
  'JOIN users u ' +
  'ON n.user_id = u.user_id ' +
  'JOIN roles r '+ 
  'ON r.role_id = u.role_id ' +
  'join wards w ' +
  'ON n.nurse_ward_id = w.ward_id';

  if(req.query.nurse_ward_id) {
    sql += ' WHERE n.nurse_ward_id = ' + db.escape(req.query.nurse_ward_id);
  }

  db.query(sql, (err, result) => {
    if(err) throw err;
    return res.json(result);
  })
})

//Get Doctor Details
app.get('/api/nurse-details/:id', (req, res) => {
  const id = req.params.id;

  const sql = `SELECT d.nurse_id, u.user_name, u.user_surname, u.join_date, u.user_email, d.nurse_license_number, w.ward_name, dp.department_name FROM users u 
  JOIN nurses d 
  ON u.user_id = d.user_id 
  JOIN wards w 
  ON w.ward_id = nurse_ward_id 
  JOIN dpartments dp 
  ON dp.department_id = w.department_id 
  WHERE u.user_reference = ${db.escape(id)}`;

  db.query(sql, (err, result) => {
    if(err) throw err;
    return res.json(result);
  })
})

//Delete Nurse Record

app.delete('/api/delete-nurse/:user_id/:nurse_id', (req, res) => {
  const { user_id, nurse_id } = req.params;
  
  const sql_user = `DELETE FROM users WHERE users.user_id = ${db.escape(user_id)}`;
  
  const sql_nuse = `DELETE FROM nurses WHERE nurses.nurse_id = ${db.escape(nurse_id)}`;


  db.query(sql_nuse, (err, result) => {
    if(err) throw err;
    
    db.query(sql_user, (err, result) => {
      if(err) throw err;
      return res.json({ message: 'User Deleted successfully' });
    })

  })

})

//Get All Doctors
app.get('/api/doctors', (req, res) => {
  let sql = 'SELECT d.doctor_id, u.user_id, u.user_reference, u.user_name, u.user_surname, u.user_email, d.doctor_license_number, d.doctor_ward_id FROM doctors d ' +
  'JOIN users u ' +
  'ON u.user_id = d.user_id';

  if(req.query.doctor_ward_id) {
    sql += ' WHERE d.doctor_ward_id = ' + db.escape(req.query.doctor_ward_id);
  }

  db.query(sql, (err, result) => {
    if(err) throw err;
    return res.json(result);
  })
})

//Get Doctor Details
app.get('/api/doctor-details/:id', (req, res) => {
  const id = req.params.id;

  const sql = `SELECT d.doctor_id, u.user_name, u.user_surname, u.join_date, u.user_email, d.doctor_license_number, w.ward_name, dp.department_name FROM users u 
  JOIN doctors d 
  ON u.user_id = d.user_id 
  JOIN wards w 
  ON w.ward_id = doctor_ward_id 
  JOIN dpartments dp 
  ON dp.department_id = w.department_id 
  WHERE u.user_reference = ${db.escape(id)}`;

  db.query(sql, (err, result) => {
    if(err) throw err;
    return res.json(result);
  })
})

//Delete Doctor Record
app.delete('/api/delete-doctor/:user_id/:doctor_id', (req, res) => {
  const { user_id, doctor_id } = req.params;
  
  const sql_user = `DELETE FROM users WHERE users.user_id = ${db.escape(user_id)}`;
  
  const sql_doc = `DELETE FROM doctors WHERE doctors.doctor_id = ${db.escape(doctor_id)}`;

  db.query(sql_doc, (err, result) => {
    if(err) throw err;
    
    db.query(sql_user, (err, result) => {
      if(err) throw err;
      return res.json({ message: 'User Deleted successfully' });
    })

  })

})


//Get Patients
app.get('/api/patients', (req, res) => {
  let sql = 
  'select '+
  ' u.*, p.patient_id,  w.ward_id , w.ward_description ,  '+
  ' w.ward_name, p.patient_title,  '+
  ' p.patient_marital_status, p.ID_Number, p.from_address, p.from_province,  '+
  ' p.from_town, p.from_area_code, p.language, p.admission_reason,  '+
  ' r.name_surname,r.contact_number,r.alt_contact_number,r.relationship, '+
  ' pf.file_id,pf.file_name,pf.health_details,pf.medical_history,pf.previous_treatment, h.condition_name, h.condition_description, '+
  ' pl.file_log_date, pl.edited_by '+
  ' from users u '+
  ' join patients p  '+
  ' on u.user_id = p.user_id '+
  ' join wards w '+
  ' on p.patient_ward_id = w.ward_id '+
  ' join relatives r '+
  ' on r.relative_id = p.relative_id '+
  ' join patient_files pf '+
  ' on pf.patient_id = p.patient_id '+
  ' join health_conditions h '+
  ' on h.condition_id = pf.condition_id '+
  ' join patient_file_logs pl '+
  ' on pl.file_id = pf.file_id ';


  if(req.query.patient_id) {
    sql += ' WHERE p.patient_id = ' + db.escape(req.query.patient_id);
  }

  db.query(sql, (err, result) => {
    if(err) throw err;
    return res.json(result);
  })
})


// Delete Patient
app.delete('/api/delete-patient/:user_id', (req, res) => {
  const { user_id } = req.params;
  
  const sql_user = `DELETE FROM users WHERE users.user_id = ${db.escape(user_id)}`;
  
  db.query(sql_user, (err, result) => {
    if (err) {
      res.status(500).json({ error: 'Failed to delete patient' });
    } else {
      res.status(200).json({ message: 'Patient deleted successfully' });
    }
  });
});






// ===================================================================================

app.get('/api/role/:roleName', (req, res) => {
  const roleName = req.params.roleName;
  const sql = 'SELECT * FROM roles WHERE role_name = ?';
  db.query(sql, [roleName], (err, result) => {
    if(err) throw err;
    return res.json(result);
  })
})


// ===================================================================================
// =========================Post Data Only Only!!!!======================================= 

// Add an admin
app.post('/api/create-admins', (req, res) => {
  const { user_reference, user_name, user_surname, user_email, user_password, role_id, user_id, is_active } = req.body;

  // Insert into users table
  const sqlUsers = 'INSERT INTO users (user_id, user_reference, user_name, user_surname, user_email, user_password, role_id, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
  db.query(sqlUsers, [user_id, user_reference, user_name, user_surname, user_email, user_password, role_id, is_active], (err, result) => {
    if (err) throw err;

    // Insert into admins table
    const sqlAdmins = 'INSERT INTO admins (user_id) VALUES (?)';
    db.query(sqlAdmins, [user_id], (err, result) => {
      if (err) throw err;
      return res.json({ message: 'Admin User added successfully' });
    });
  });
});



// Add an Nurse
app.post('/api/create-nurses', (req, res) => {
  const { user_name, user_reference, user_surname, user_email, user_password, role_id, user_id, is_active, nurse_license_number, nurse_ward_id } = req.body;

  

  //Insert into users table
  const sqlUsers = 'INSERT INTO users (user_id, user_reference, user_name, user_surname, user_email, user_password, role_id, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
  db.query(sqlUsers, [user_id, user_reference, user_name, user_surname, user_email, user_password, role_id, is_active], (err, result) => {
    if (err) throw err;

    // Insert into admins table
    const sqlAdmins = 'INSERT INTO nurses (user_id, nurse_ward_id, nurse_license_number) VALUES (?, ?, ?)';
    db.query(sqlAdmins, [user_id, nurse_ward_id, nurse_license_number], (err, result) => {
      if (err) throw err;
      return res.json({ message: 'Nurse User added successfully' });
    });
  });
});


// Add a Doctor
app.post('/api/create-doctors', (req, res) => {
  const { user_name, user_reference, user_surname, user_email, user_password, role_id, user_id, is_active, doctor_license_number, doctor_ward_id } = req.body;

  

  //Insert into users table
  const sqlUsers = 'INSERT INTO users (user_id, user_reference, user_name, user_surname, user_email, user_password, role_id, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
  db.query(sqlUsers, [user_id, user_reference, user_name, user_surname, user_email, user_password, role_id, is_active], (err, result) => {
    if (err) throw err;

    // Insert into admins table
    const sqlAdmins = 'INSERT INTO doctors (user_id, doctor_ward_id, doctor_license_number) VALUES (?, ?, ?)';
    db.query(sqlAdmins, [user_id, doctor_ward_id, doctor_license_number], (err, result) => {
      if (err) throw err;
      return res.json({ message: 'Doctor User added successfully' });
    });
  });
});


// Add a Patient
app.post('/api/create-patients', (req, res) => {
  const { 
    patientName,patientSurname,user_email,patientIdNumber,patientLanguage,maritalStatus,nokRelationship,nokNameSurname,nokContactNo,nokAltContactNo,patientAddress,patientTown,patientAreaCode,file_name,editedBy,
    patientProvince,patientWardID,admissionReason,patientConditionID,patientMedicalHistory,patientPrevTreatment,user_id,user_reference,user_password,role_id,is_active,lastrelativeID,lastPatientID,patient_title
  } = req.body;


  //Insert into users table
  const sqlUsers = 'INSERT INTO users (user_id, user_reference, user_name, user_surname, user_email, user_password, role_id, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
  db.query(sqlUsers, [user_id, user_reference, patientName, patientSurname, user_email, user_password, role_id, is_active], (err, result) => {
    if (err) throw err;

    // Insert into Patients table
    const sqlPatients = 'INSERT INTO patients (user_id, patient_ward_id, ID_Number,language,patient_marital_status,from_address,from_province,from_town,from_area_code,admission_reason,patient_title,relative_id) VALUES (?, ?, ?,?, ?, ?,?, ?, ?,?, ?,?)';
    db.query(sqlPatients, [user_id, patientWardID, patientIdNumber,patientLanguage,maritalStatus,patientAddress,patientProvince,patientTown,patientAreaCode,admissionReason,patient_title,lastrelativeID], (err, result) => {
      if (err) throw err;

       // Get the ID of the inserted patient
        const lastPatientIDA = result.insertId;
      
        const sqlRelatives = 'INSERT INTO relatives (relative_id, patient_id, name_surname ,contact_number, alt_contact_number, relationship) VALUES (?, ?, ?, ?, ?, ?)';
        db.query(sqlRelatives, [lastrelativeID, lastPatientIDA, nokNameSurname, nokContactNo,nokAltContactNo,nokRelationship], (err, result) => {
          if (err) throw err;

              const sqlFile = 'INSERT INTO patient_files (patient_id, condition_id , medical_history, previous_treatment, file_name) VALUES (?, ?, ?, ?, ?)';

              db.query(sqlFile, [lastPatientIDA, patientConditionID, patientMedicalHistory,patientPrevTreatment,file_name], (err, result) => {
                if (err) throw err;

                const lastFileIDA = result.insertId;

                    const sqlFileLogs = 'INSERT INTO patient_file_logs (file_id, edited_by) VALUES (?, ?)';

                    db.query(sqlFileLogs, [lastFileIDA, editedBy], (err, result) => {
                      if (err) throw err;

                      return res.json({ message: 'Patient added successfully' });
                    });
              });
        });
    });
  });
});



// ===================================================================================
// =========================Statistics Only!!!!======================================= 

//Get Last active user
app.get('/api/last-active-user', (req, res) => {
  const sql = 'SELECT MAX(user_id) '+
  'as last_user FROM users';
  db.query(sql, (err, result) => {
    if(err) throw err;
    return res.json(result);
  })
})
//Get Last active patient
app.get('/api/lastPatientId', (req, res) => {
  const sql = 'SELECT MAX(patient_id) as last_patient FROM patients';

  db.query(sql, (err, result) => {
    if (err) throw err;

    // If the result is NULL, return 0, otherwise return the result
    const lastPatientId = result[0].last_patient === null ? 0 : result[0].last_patient;
    res.json({ lastPatientId });
  });
});
//Get Last active relative
app.get('/api/lastRelativeId', (req, res) => {
  const sql = 'SELECT MAX(patient_id) as last_relative FROM relatives';

  db.query(sql, (err, result) => {
    if (err) throw err;

    // If the result is NULL, return 0, otherwise return the result
    const lastRelativeId = result[0].last_relative === null ? 0 : result[0].last_relative;
    res.json({ lastRelativeId });
  });
});

//Total Nurses, Doctors and Patients
app.get('/api/user-stats', (req, res) => {
  const sql = 'SELECT ' +
  ' COUNT( CASE WHEN r.role_name = \'Admin\' THEN 1 ELSE NULL END) as admins,'+
  ' COUNT( CASE WHEN r.role_name = \'Doctor\' THEN 1 ELSE NULL END) as doctors, '+
  ' COUNT( CASE WHEN r.role_name = \'Nurse\' THEN 1 ELSE NULL END) as nurses, ' +
  ' COUNT( CASE WHEN r.role_name = \'Patient\' THEN 1 ELSE NULL END) as patients '+
  ' from users u '+
  ' JOIN roles r '+
  ' ON u.role_id = r.role_id';
  db.query(sql, (err, result) => {
    if(err) throw err;
    return res.json(result);
  })
})

//Get number of departments and wards
app.get('/api/total-dep-wards', (req, res) => {
  const sql = 'SELECT ' +
  ' COUNT(DISTINCT wards.department_id) as departments, '+
  ' COUNT(wards.ward_name) as wards ' +
  ' from wards';
  db.query(sql, (err, result) => {
    if(err) throw err;
    return res.json(result);
  })
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
})