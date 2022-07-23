const router = require('express').Router()
const pgp = require('pg-promise')()
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const dotenv = require("dotenv")
// const cors = require("cors")
// const { formDataToBlob } = require('formdata-polyfill/esm.min')

// router.use(cors())
dotenv.config()
//database config
const config = {
	connectionString: `${process.env.DATABASE_URL}` || 'postgresql://postgres:32010@localhost:5432/fema_app'
}

if(process.env.NODE_ENV == 'production'){
    config.ssl = {
		rejectUnauthorized : false
	}
    config.connectionString = `${process.env.DATABASE_URL}
}
const db = pgp(config)
//test route
 router.get('/', async (req, res) => {
     res.json('it works')
 })

//register users route
router.post('/register', async (req, res) => {
    try {
        let full_name = req.body.full_name
        let email = req.body.email
        let password = req.body.password

        bcrypt.hash(password, 10).then(async(hashedPass) => {
            await db.none('insert into users(full_name, email, password) values ($1, $2, $3)', [full_name, email, hashedPass])
        });
        res.json('user registered successfully');
    }catch (error) {
        	res.json({
			status: "error",
			error: error.message,
		});
    }
 
});

//login users route
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


// router.post("/registerFacility", async (req, res) => {
// 	try {
//         const {facilityName, location, reg, capacity, contact, facilityEmail, facilityPass} = req.body;
// 		bcrypt.hash(facilityPass, 10).then(async (hashedPass) => {
// 			await db.none(
// 				"insert into facilities(facility_name, facility_location, facility_reg, facility_capacity, facility_contacno, facility_email, password) values ($1, $2, $3, $4, $5, $6, $7)",
// 				[facilityName, location, reg, capacity, contact, facilityEmail, hashedPass]
// 			);
// 		res.json("Facility registered successfully");

// 		});
// 	} catch (error) {
// 		res.json({
// 			status: "error",
// 			error: error.message,
// 		});
// 	}
// });

//register facilities route
router.post('/registerFacility', async (req, res) => {
    try {
        const { facName, facLocation, facReg, capacity, contactno, email, password, services } = req.body
        bcrypt.hash(password, 10)
        .then(async(hashedPass) => {
            await db.none('insert into facilities(facility_name, facility_location, facility_reg, facility_capacity, facility_contacno, facility_email, password) values ($1, $2, $3, $4, $5, $6, $7)', [facName, facLocation, facReg, capacity, contactno, email, hashedPass])
            let facilityId = await db.one('select facility_id from facilities where facility_email = $1', [email])
            services.forEach(service => db.none('insert into services(facility_ref, serv_config_ref) values ($1, $2)', [facilityId.facility_id, service]))
        })
        res.json('Succesful registration')
    } 
    catch (error) {
        console.log(error)
        res.json(error)
    }
})


//login facility route
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
    try {
        const services = await db.many(`select * from service_config`);
        res.json({
            services
        })
    } 
    catch (error) {
        res.json(error)
    }
});

//get a service route

router.get('/services/:servicename', async (req, res) => {
    const {servicename} = req.params.servicename;
    console.log(req.params)
    const results = await db.oneOrNone(`select * from services where servicename = $1`, [servicename.toLowerCase()]);
    console.log(results);

    res.json({
        service: results
    })
});
 
//make booking route
router.post('/makebooking', async (req, res) => {
    try {
        const { email, facilityName, date, time, serviceId } = req.body;
        // let email = 'sanemadesi@gmail.com'
        // let facilityName = 'Clinic 100'
        // let date = '10-12-2022'
        // let time = '10:00'
        // let serviceId = 1
        let userRef = await db.oneOrNone('select user_id from users where email = $1', [email])
        console.log(userRef);
        if (userRef) {
            let facilityRef = await db.any('select facility_id from facilities where facility_name = $1', [facilityName]);
            console.log(facilityRef);
            await db.none("insert into bookings(user_ref, facility_ref, service_id, booking_date, booking_time, booking_status) values ($1, $2, $3, $4, $5, $6)", [userRef.user_id, facilityRef[0].facility_id, serviceId, date, time, 'pending'])
        }
        

        res.json({
            message: 'Booking Successful'
        })
    }

    catch(error){
        console.log(error)
        res.json(error)
    }
})

//return all bookings made by user route
router.get('/userbookings', async (req, res) => {
    try {
        let userEmail = req.body.email
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

//get all the bookings made by users to a facility
router.get('/facilitybookings', async (req, res) => {
    try {
        let facilityEmail = req.body.email
        let facilityRef = await db.any('select facility_id from facilities where facility_email = $1', [facilityEmail])
        console.log(facilityRef)
        let bookings = await db.any('select * from bookings where facility_ref = $1', [facilityRef[0].facility_id])
        res.json(bookings)
    } 
    
    catch (error) {
        res.json(error)
    }
})

//get all the facilities that offer a service route
router.get('/facilities/:id', async (req, res) => {
    try {       
       let serviceId = req.params.id
       let facilities = await db.any('select facilities.* from service_config inner join services on serv_config_id = serv_config_ref inner join facilities on facility_id = facility_ref where serv_config_id = $1', [serviceId])
       res.json({
        facilities
       })
    } 
    
    catch (error) {
        console.log(error)
        res.json(error)
    }
})

//update booking status route
router.post('/bookings/:id', async (req, res) => {
    try {
        let id = req.params.id
        await db.none('update bookings set booking_status = $1 where booking_id = $2',['confirmed', id])
        res.json('booking accepted')
    } 
    catch (error) {
        res.json('Something went wrong. Please try again')
    }
})

//delete bookings route
router.delete('/userbookings/:id', async (req, res) => {
   try {
    let bookingId = 3
    await db.none('delete from bookings where booking_id = $1', [bookingId])
    res.json('Booking successfully deleted.')
   } 
   
   catch (error) {
    res.json('Something went wrong. Please try again.')
   }
})

//edit bookings route
router.put('/userbookings/:id', async (req, res) => {
    try {
        let bookingId = req.params.id
        const { date, time } = req.body
        await db.none('update bookings set booking_date = $1, booking_time = $2 where booking_id = $3', [date, time, bookingId])
        await db.none('update bookings set booking_status = $1 where booking_id = $2', ['pending', bookingId])
        res.json('Booking updated successfully')
    } 
    catch (error) {
        res.json('Something went wrong. Please try again')
    }
})

module.exports = router
