import cors from "cors";
import express from "express";
import { buildSchema, graphql } from "graphql";
import mongoose from "mongoose";

const app = express();
const port = process.env.PORT || 4000;
const mongoUri =
  "mongodb+srv://admin:admin@cluster0.pr9ljgt.mongodb.net/comp3133_101484997_assignment2?appName=Cluster0";

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const sessions = new Map();

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
  },
  { timestamps: true },
);

const employeeSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    gender: { type: String, required: true },
    designation: { type: String, required: true, trim: true },
    salary: { type: Number, required: true },
    dateOfJoining: { type: String, required: true },
    department: { type: String, required: true, trim: true },
    position: { type: String, required: true, trim: true },
    profilePicture: { type: String, default: "" },
  },
  { timestamps: true },
);

const UserModel = mongoose.model("User", userSchema);
const EmployeeModel = mongoose.model("Employee", employeeSchema);

const schema = buildSchema(`
  type User {
    id: ID!
    username: String!
    email: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Employee {
    id: ID!
    firstName: String!
    lastName: String!
    email: String!
    gender: String!
    designation: String!
    salary: Float!
    dateOfJoining: String!
    department: String!
    position: String!
    profilePicture: String
  }

  input EmployeeInput {
    firstName: String!
    lastName: String!
    email: String!
    gender: String!
    designation: String!
    salary: Float!
    dateOfJoining: String!
    department: String!
    position: String!
    profilePicture: String
  }

  input EmployeeUpdateInput {
    firstName: String
    lastName: String
    email: String
    gender: String
    designation: String
    salary: Float
    dateOfJoining: String
    department: String
    position: String
    profilePicture: String
  }

  type Query {
    employees(department: String, position: String): [Employee!]!
    employee(id: ID!): Employee
  }

  type Mutation {
    signup(username: String!, email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    addEmployee(input: EmployeeInput!): Employee!
    updateEmployee(id: ID!, input: EmployeeUpdateInput!): Employee!
    deleteEmployee(id: ID!): Boolean!
  }
`);

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
  };
}

function requireAuth(context) {
  const token = context.token;
  if (!token || !sessions.has(token)) {
    throw new Error("Authentication required.");
  }
  return sessions.get(token);
}

function createSession(user) {
  const token = `token-${user.id}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  sessions.set(token, user.id);
  return {
    token,
    user: publicUser(user),
  };
}

function toEmployee(employee) {
  return {
    id: employee.id,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    gender: employee.gender,
    designation: employee.designation,
    salary: employee.salary,
    dateOfJoining: employee.dateOfJoining,
    department: employee.department,
    position: employee.position,
    profilePicture: employee.profilePicture,
  };
}

async function seedDatabase() {
  const userCount = await UserModel.countDocuments();
  if (userCount === 0) {
    await UserModel.create({
      username: "admin",
      email: "admin@example.com",
      password: "Admin123!",
    });
  }

  const employeeCount = await EmployeeModel.countDocuments();
  if (employeeCount === 0) {
    await EmployeeModel.insertMany([
      {
        firstName: "Ava",
        lastName: "Patel",
        email: "ava.patel@example.com",
        gender: "Female",
        designation: "Software Developer",
        salary: 82000,
        dateOfJoining: "2024-05-13",
        department: "Engineering",
        position: "Developer",
        profilePicture: "",
      },
      {
        firstName: "Liam",
        lastName: "Nguyen",
        email: "liam.nguyen@example.com",
        gender: "Male",
        designation: "HR Coordinator",
        salary: 61000,
        dateOfJoining: "2023-11-07",
        department: "Human Resources",
        position: "Coordinator",
        profilePicture: "",
      },
    ]);
  }
}

const root = {
  employees: async ({ department, position }, context) => {
    requireAuth(context);
    const query = {};

    if (department) {
      query.department = { $regex: department, $options: "i" };
    }

    if (position) {
      query.position = { $regex: position, $options: "i" };
    }

    const employees = await EmployeeModel.find(query).sort({ createdAt: -1 });
    return employees.map(toEmployee);
  },
  employee: async ({ id }, context) => {
    requireAuth(context);
    const employee = await EmployeeModel.findById(id);
    return employee ? toEmployee(employee) : null;
  },
  signup: async ({ username, email, password }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await UserModel.findOne({ email: normalizedEmail });

    if (existingUser) {
      throw new Error("Email is already registered.");
    }

    const user = await UserModel.create({
      username: username.trim(),
      email: normalizedEmail,
      password,
    });
    return createSession(user);
  },
  login: async ({ email, password }) => {
    const user = await UserModel.findOne({
      email: email.trim().toLowerCase(),
      password,
    });

    if (!user) {
      throw new Error("Invalid email or password.");
    }

    return createSession(user);
  },
  addEmployee: async ({ input }, context) => {
    requireAuth(context);
    const employee = await EmployeeModel.create({
      ...input,
      profilePicture: input.profilePicture || "",
    });
    return toEmployee(employee);
  },
  updateEmployee: async ({ id, input }, context) => {
    requireAuth(context);
    const employee = await EmployeeModel.findByIdAndUpdate(
      id,
      Object.fromEntries(
        Object.entries(input).filter(
          ([, value]) => value !== null && value !== undefined,
        ),
      ),
      { new: true, runValidators: true },
    );

    if (!employee) {
      throw new Error("Employee not found.");
    }

    return toEmployee(employee);
  },
  deleteEmployee: async ({ id }, context) => {
    requireAuth(context);
    const result = await EmployeeModel.findByIdAndDelete(id);
    return Boolean(result);
  },
};

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/graphql", async (req, res) => {
  console.log("GraphQL request received");

  const token = req.headers.authorization?.replace("Bearer ", "");
  const result = await graphql({
    schema,
    source: req.body.query,
    rootValue: root,
    variableValues: req.body.variables,
    contextValue: { token },
  });

  if (result.errors) {
    console.error(result.errors.map((error) => error.message).join(" "));
  }

  res.status(result.errors ? 400 : 200).json(result);
});

await mongoose.connect(mongoUri);
await seedDatabase();

app.listen(port, () => {
  console.log(`GraphQL API running on http://localhost:${port}/graphql`);
});
