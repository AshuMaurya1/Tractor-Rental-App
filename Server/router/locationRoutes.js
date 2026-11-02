import express from 'express'
import { getBlocks, getDistricts, getStates, getVillages } from '../controllers/locationController.js'

const locationRouter = express.Router()
locationRouter.get('/states', getStates)
locationRouter.get('/districts', getDistricts)
locationRouter.get('/blocks', getBlocks)
locationRouter.get('/villages', getVillages)

export default locationRouter
