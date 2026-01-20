import { Router } from 'express';
import { expenseController } from './controllers/expense.controller';
import { employeeController } from './controllers/employee.controller';
import { toolController } from './controllers/tool.controller';
import { trafficController } from './controllers/traffic.controller';
import { financialDashboardController } from './controllers/dashboard.controller';
import { authMiddleware } from '../auth/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Dashboard routes
router.get('/dashboard/macro', (req, res) => financialDashboardController.getMacroView(req, res));
router.get('/dashboard/trend', (req, res) => financialDashboardController.getMonthlyTrend(req, res));
router.get('/dashboard/summary', (req, res) => financialDashboardController.getSummaryCards(req, res));

// Expense routes
router.get('/expenses', (req, res) => expenseController.findAll(req, res));
router.post('/expenses', (req, res) => expenseController.create(req, res));
router.get('/expenses/:id', (req, res) => expenseController.findById(req, res));
router.put('/expenses/:id', (req, res) => expenseController.update(req, res));
router.delete('/expenses/:id', (req, res) => expenseController.delete(req, res));

// Employee routes
router.get('/employees', (req, res) => employeeController.findAll(req, res));
router.post('/employees', (req, res) => employeeController.create(req, res));
router.get('/employees/payroll', (req, res) => employeeController.getPayroll(req, res));
router.get('/employees/:id', (req, res) => employeeController.findById(req, res));
router.put('/employees/:id', (req, res) => employeeController.update(req, res));
router.delete('/employees/:id', (req, res) => employeeController.delete(req, res));

// Tool routes
router.get('/tools', (req, res) => toolController.findAll(req, res));
router.post('/tools', (req, res) => toolController.create(req, res));
router.get('/tools/cost', (req, res) => toolController.getMonthlyCost(req, res));
router.get('/tools/:id', (req, res) => toolController.findById(req, res));
router.put('/tools/:id', (req, res) => toolController.update(req, res));
router.delete('/tools/:id', (req, res) => toolController.delete(req, res));

// Traffic routes
router.get('/traffic', (req, res) => trafficController.findAll(req, res));
router.post('/traffic', (req, res) => trafficController.create(req, res));
router.get('/traffic/platforms', (req, res) => trafficController.getByPlatform(req, res));
router.get('/traffic/:id', (req, res) => trafficController.findById(req, res));
router.put('/traffic/:id', (req, res) => trafficController.update(req, res));
router.delete('/traffic/:id', (req, res) => trafficController.delete(req, res));

export default router;
