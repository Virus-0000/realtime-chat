import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { loginUser } from "../api/authApi";
import { getErrorMessage } from "../api/axios";
import { useAuth } from "../context/authContext";
import AuthLayout from "../components/common/AuthLayout";
import Button from "../components/common/Button";

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({ email: "", password: "" });
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (event) => {
        setForm({ ...form, [event.target.name]: event.target.value });
        setErrors({ ...errors, [event.target.name]: "" });
        setServerError("");
    };

    const validate = () => {
        const next = {};

        if (!EMAIL_PATTERN.test(form.email.trim())) next.email = "Enter a valid email address.";
        if (!form.password) next.password = "Enter your password.";

        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!validate()) return;

        setLoading(true);

        try {
            const data = await loginUser({
                email: form.email.trim(),
                password: form.password
            });

            login(data.token, data.user);
            navigate("/chat", { replace: true });
        } catch (error) {
            setServerError(getErrorMessage(error, "Login failed. Please try again."));
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Welcome back"
            subtitle="Sign in to pick up where you left off."
            footer={
                <>
                    New to Relay? <Link to="/register">Create an account</Link>
                </>
            }
        >
            <form className="auth__form" onSubmit={handleSubmit} noValidate>
                {serverError && (
                    <p className="form-error" role="alert">{serverError}</p>
                )}

                <label className="field">
                    <span className="field__label">Email</span>
                    <span className={`field__control ${errors.email ? "has-error" : ""}`}>
                        <Mail size={17} aria-hidden="true" />
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            autoComplete="email"
                            autoFocus
                        />
                    </span>
                    {errors.email && <span className="field__error">{errors.email}</span>}
                </label>

                <label className="field">
                    <span className="field__label">Password</span>
                    <span className={`field__control ${errors.password ? "has-error" : ""}`}>
                        <LockKeyhole size={17} aria-hidden="true" />
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="Your password"
                            autoComplete="current-password"
                        />
                        <button
                            type="button"
                            className="field__toggle"
                            onClick={() => setShowPassword((shown) => !shown)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                    </span>
                    {errors.password && <span className="field__error">{errors.password}</span>}
                </label>

                <Button type="submit" size="lg" loading={loading} className="auth__submit">
                    Sign in
                </Button>
            </form>
        </AuthLayout>
    );
}

export default Login;
