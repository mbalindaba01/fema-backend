const router = require('express').Router()
const pgp = require('pg-promise')()
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const dotenv = require("dotenv")
const cors = require("cors")
// const { formDataToBlob } = require('formdata-polyfill/esm.min')

router.use(cors())
dotenv.config()
//database config
const config = {
	connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Minenhle!28@localhost:5432/fema_app',
    ssl: {
        require: true,
        rejectUnauthorized: false
    }
}
const db = pgp(config)

router.get('/', async (req, res) => {
    res.json('it works')
})

router.post('/register', async (req, res) => {
    try {
        let fullName = req.body.name
        let email = req.body.email
        let password = req.body.password
        bcrypt.hash(password, 10).then(async(hashedPass) => {
        await db.none('insert into users(full_name, email, password) values ($1, $2, $3)', [fullName, email, hashedPass])
    });
    res.json('user registered successfully');

    } catch (error) {
        	res.json({
			status: "error",
			error: error.message,
		});
    }
 
})
router.post("/login", async (req, res) => {
	const { password, email} = req.body;

	const user = await db.oneOrNone(`select * from users where email=$1`, [
		email,
	]);
	if (!user) return res.status(400).send("User does not exist");

	const dbPassword = user.password;

	const validPass = await bcrypt.compare(password, dbPassword);
	if (!validPass) return res.status(400).send("Invalid email or password");
	//create and assign token
	const tokenUser = { email: email };
	const token = jwt.sign(tokenUser, process.env.TOKEN_SECRET);

	res.header("access_token", token).send(token);
}); 

router.post("/registerFacility", async (req, res) => {
	try {
        const {facilityName, location, reg, capacity, contact, facilityEmail, serviceId, facilityPass} = req.body;
		bcrypt.hash(facilityPass, 10).then(async (hashedPass) => {
			await db.none(
				"insert into facilities(facility_name, facility_location, facility_reg, facility_capacity, facility_contacno, facility_email, services_ids, password) values ($1, $2, $3, $4, $5, $6, $7, $8)",
				[facilityName, location, reg, capacity, contact, facilityEmail, serviceId, hashedPass]
			);
		});
		res.json("Facility registered successfully");
	} catch (error) {
		res.json({
			status: "error",
			error: error.message,
		});
	}
});

router.post("/loginFacility", async (req, res) => {
	const { facilityPass, facilityEmail} = req.body;

	const user = await db.oneOrNone(
		`select * from facilities where facility_email=$1`,
		[facilityEmail]
	);
	if (!user) return res.status(400).send("Facility does not exist");

	const dbPassword = user.password;

	const validPass = await bcrypt.compare(facilityPass, dbPassword);
	if (!validPass) return res.status(400).send("Invalid email or password");
	//create and assign token
	const tokenUser = { email: facilityEmail };
	const token = jwt.sign(tokenUser, process.env.FACTOKEN_SECRET);

	res.header("access_token", token).send(token);
}); 

router.get('/services', async (req, res) => {
    const results = await db.many(`select * from service_config`);
    let services = [];

    results.forEach(result => {
        // console.log(result.services);
        //prevent duplicates
        result.services.forEach(service => {
            if (!services.includes(service)) {
                services.push(service);
            }
        });
       
    });
    res.json({
        services
    })
});

router.get('/services/:servicename', async (req, res) => {

    const {servicename} = req.params;
    const results = await db.oneOrNone(`select * from services where servicename = $1`, [servicename.toLowerCase()]);
    console.log(results);

    res.json({
        service: results
    })
});
 

router.post('/booking', async (req, res) => {
    try {
        const { email, facilityName, date, time, serviceId } = req.body;
        // let email = 'sanemadesi@gmail.com'
        // let facilityName = 'clicks'
        // let date = '10-12-2022'
        // let time = '10:00'
        // let serviceId = 1
        let userRef = await db.oneOrNone('select user_id from users where email = $1', [email])
        let facilityRef = await db.oneOrNone('select facility_id from facilities where facility_name = $1', [facilityName])
        console.log(facilityRef.facility_id)
        await db.none("insert into bookings(user_ref, facility_ref, service_id, booking_date, booking_time) values ($1, $2, $3, $4, $5)", [userRef.user_id, facilityRef.facility_id, serviceId, date, time])

        res.json({
            message: 'Booking Successful'
        })
    }

    catch(error){
        res.json(error)
    }
})

router.get('/userbookings', async (req, res) => {
    try {
        // let userEmail = req.body.email
        let userEmail = 'mbalindaba01@gmail.com'
        let userID = await db.any('select user_id from users where email = $1', [userEmail])
        let bookings = await db.any('select * from bookings where user_ref = $1', [userID[0].user_id])
        res.json({
            bookings
        })
    }
    
    catch (error) {
        res.json(error)
    }
})

router.get('/facilitybookings', async (req, res) => {
    try {
        let facilityEmail = 'clicksgmail.com'
        let facilityRef = await db.any('select facility_id from facilities where facility_email = $1', [facilityEmail])
        console.log(facilityRef)
        let bookings = await db.any('select * from bookings where facility_ref = $1', [facilityRef[0].facility_id])
        console.log(bookings)
        res.json(bookings)
    } 
    
    catch (error) {
        res.json(error)
    }
})

router.get('/facilities', async (req, res) => {
    try {
       let serviceId = req.body.id
       let facilities = await db.any('select facilities.* from service_config inner join services on serv_config_id = serv_config_ref inner join facilities on facility_id = facility_ref where serv_config_id = $1', [serviceId])
       res.json(facilities)
    } 
    
    catch (error) {
        console.log(error)
        res.json(error)
    }
})

router.post('/faclogin', (req, res) => {
    
})

router.post('/facreg', async (req, res) => {
    try {
        const { facName, facLocation, facReg, capacity, contactno, email, password, services } = req.body
        // let facName = 'Clinic 70',
        //     facLocation = 'Johannesburg',
        //     facReg = '12222',
        //     capacity = 3,
        //     contactno = '070969969',
        //     email = 'clinic70@gmail.com',
        //     password = '70123Cl'
        //     services = [1, 2, 3]
        await db.none('insert into facilities(facility_name, facility_location, facility_reg, facility_capacity, facility_contacno, facility_email, password) values ($1, $2, $3, $4, $5, $6, $7)', [facName, facLocation, facReg, capacity, contactno, email, password])
        let facilityId = await db.one('select facility_id from facilities where facility_email = $1', [email])
        services.forEach(service => db.none('insert into services(facility_ref, serv_config_ref) values ($1, $2)', [facilityId.facility_id, service]))
        res.json('Succesful registration')
    } 
    
    catch (error) {
        console.log(error)
        res.json(error)
    }
})

module.exports = router
