const router = require('express').Router()
const pgp = require('pg-promise')()
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const dotenv = require("dotenv")
const cors = require("cors")

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
	const { password, email, fullName} = req.body;

	const user = await db.oneOrNone(`select * from users where email=$1`, [
		email,
	]);
	if (!user) return res.status(400).send("User does not exist");

	const dbPassword = user.password;

	const validPass = await bcrypt.compare(password, dbPassword);
	if (!validPass) return res.status(400).send("Invalid email or password");
	//create and assign token
	const tokenUser = {Name: fullName, email: email };
	const token = jwt.sign(tokenUser, process.env.TOKEN_SECRET);

	res.header("access_token", token).send(token);
}); 

router.get('/services', async (req, res) => {
    const results = await db.many(`select services from facilities`);
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

router.get('/facilities', async (req, res) => {
    try {
        const {facility_name} = req.query;
       let servicesOfferedByFacility = await db.many(`select * from facilities where facility_name = $1`, [facility_name]);
       console.log(servicesOfferedByFacility);
        res.json({data: servicesOfferedByFacility});
    } 
    
    catch (error) {
        console.log(error)
        res.json(error)
    }
})

router.get('/services/:servicename', async (req, res) => {

    const {servicename} = req.params;
    const results = await db.oneOrNone(`select * from services where servicename = $1`, [servicename.toLowerCase()]);
    console.log(results);

    res.json({
        service: results
    })
});


router.post("/login", async (req, res) => {
	const { password, email, fullName} = req.body;

	const user = await db.oneOrNone(`select * from users where email=$1`, [
		email,
	]);
	if (!user) return res.status(400).send("User does not exist");

	const dbPassword = user.password;

	const validPass = await bcrypt.compare(password, dbPassword);
	if (!validPass) return res.status(400).send("Invalid email or password");
	//create and assign token
	const tokenUser = {Name: fullName, email: email };
	const token = jwt.sign(tokenUser, process.env.TOKEN_SECRET);

	res.header("access_token", token).send(token);
}); 

router.post('/booking', async (req, res) => {
    try {
        const { email, facilityName, date, time, serviceId} = req.body;
        let userRef = await db.oneOrNone('select user_id from users where email = $1', [email])
        let facilityRef = await db.oneOrNone('select facility_id from facilities where facility_name = $1', [facilityName])
        console.log(facilityRef.facility_id)
        await db.none("insert into bookings(user_ref, facility_ref, service_id, booking_date, booking_time) values ($1, $2, $3, $4, $5)", [userRef.user_id, facilityRef.facility_id, serviceId, date, time])

        res.json('Booking successful')
    }

    catch(error){
        res.json(error)
    }
})

router.get('/userbookings', async (req, res) => {
    try {
        let userEmail = req.body.email
        let userID = await db.oneOrNone('select user_id from users where email = $1', [userEmail])
        let bookings = await db.any('select * from bookings where user_ref = $1', [userID.user_id])
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
        let facilityEmail = req.body.facEmail
        let facilityRef = await db.oneOrNone('select * from facilities where facility_email = $1', [facilityEmail])
        let bookings = await db.any('select * from bookings where facility_ref = $1', [facilityRef.facility_id])
        res.json(bookings)
    } 
    
    catch (error) {
        res.json(error)
    }
})

router.get('/facilities', async (req, res) => {
    try {
       let service = 'contraceptives'
       let serviceId = await db.one('select service_id from services where servicename = $1', [service])
       let facilities = await db.many('select * from facilities');
        res.json(facilities)
    } 
    
    catch (error) {
        console.log(error)
        res.json(error)
    }
})

module.exports = router
