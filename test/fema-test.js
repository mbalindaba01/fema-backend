const express = require('express');
const PgPromise = require('pg-promise')
const supertest = require('supertest');
const assert = require('assert');
const fs = require('fs');
require('dotenv').config();

const API = require('../routes/femaRoutes');

const { default: axios } = require('axios');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const config = {
	connectionString: 'postgresql://postgres:sanesh:sanesh123@localhost:5432/fema_app',
	max: 30
};

if(process.env.NODE_ENV == 'production'){
    config.ssl = {
		rejectUnauthorized : false
	}
    config.connectionString = process.env.DATABASE_URL
}

const pgp = PgPromise({});
const db = pgp(config);

API(app, db);

describe('Female app', function(){
    // before(async function () {
	// 	this.timeout(5000);
	// 	await db.none(`delete from users`);
	// 	const commandText = fs.readFileSync('./database/data.sql', 'utf-8');
	// 	await db.none(commandText)
	// });

    it('should have a test method', async () => {

		const response = await supertest(app)
			.get('/fema')
			.expect(200);

		assert.deepStrictEqual('it works', response.body);
	});

    it('should be able to register a user', async () => {
        const response = await supertest(app)
        .post('/fema/register')
        .send({full_name: 'Siweh Madesi',
        email: 'siweh@gmail.com',
        password: 'siweh'
    })

    // console.log(response.body);
    assert.equal('user registered successfully', response.body);

    })

    // it('should be able to login a user', async () => {
    //     const response = await supertest(app)
    //     .post('/fema/login')
    //     .send({
    //     email: 'siweh@gmail.com',
    //     password: 'siweh'
    // })

    // console.log(response);
    // assert.equal(token, response);

    // });

    it('should be able to register a facility', async () => {
        const response = await supertest(app)
        .post('/fema/registerFacility')
        .send({
            facName: 'Clicks12',
            facLocation: 'Bara Soweto',
            facReg: 'GP 122 44',
            capacity: 3,
            contactno: '0218995563',
            email: 'clicks@gmail.com',
            password: 'clicks12',
            services: 'pregnancy termination'
    })

    // console.log(response.body);
    assert.equal('Succesful registration', response.body);

    });

    // it('should be able to login a facility', async () => {
    //     const response = await supertest(app)
    //     .post('/fema/registerFacility')
    //     .send({
    //         email: 'clicks@gmail.com',
    //         password: 'clicks12',
    // })

    // // console.log(response.body);
    // assert.equal(token, response.body);

    // });

    it('should be able to find all the available services', async () => {
		const response = await supertest(app)
			.get('/fema/services')
			.expect(200);

		const services = response.body.data;
		assert.equal(3, services.length);

	});

    it('should be able to make a booking', async () => {
        const response = await supertest(app)
        .post('/fema/makebooking')
        .send({
            facilityName: 'Clicks12',
            email: 'clicks@gmail.com',
            date: '10-12-2022',
            time: '10:00',
            serviceId: 1
    })

    // console.log(response.body.message);
    assert.equal('Booking Successful', response.body.message);

    });

    it('should be able to get all bookings made by user', async () => {
        const response = await supertest(app)
        .get('/fema/userbookings')
        .send({
            email: 'siweh@gmail.com',
    })

    console.log(response.body.bookings);
    const userBookings = response.body.bookings;
    assert.equal(0, userBookings.length);

    });

});