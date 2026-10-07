import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { loginUser, registerUser } from "../api/authApi";
import { getErrorMessage } from "../api/axios";
import { useAuth } from "../context/authContext";
import { useToast } from "../context/toastContext";
import AuthLayout from "../components/common/AuthLayout";
import Button from "../components/common/Button";

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

function Register() {
    const { login } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();

    const [form, setForm] = useState({ name: "", email: "", password: "" });
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

        if (!form.name.trim()) next.name = "Tell us your name.";
        if (!EMAIL_PATTERN.test(form.email.trim())) next.email = "Enter a valid email address.";
        if (form.password.length < 6) next.password = "Use at least 6 characters.";

        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!validate()) return;

        setLoading(true);

        const credentials = { email: form.email.trim(), password: form.password };

        try {
            await registerUser({ name: form.name.trim(), ...credentials });
        } catch (error) {
            setServerError(getErrorMessage(error, "Registration failed. Please try again."));
            setLoading(false);
            return;
        }

        // The register endpoint doesn't return a token, so sign in right away
        try {
            const data = await loginUser(credentials);

            login(data.token, data.user);
            toast.success(`Welcome to Relay, ${form.name.trim().split(" ")[0]}!`);
            navigate("/chat", { replace: true });
        } catch {
            toast.success("Account created. Please sign in.");
            navigate("/login", { replace: true });
        }
    };

    return (
        <AuthLayout
            title="Create your account"
            subtitle="It takes less than a minute."
            footer={
                <>
                    Already have an account? <Link to="/login">Sign in</Link>
                </>
            }
        >
            <form className="auth__form" onSubmit={handleSubmit} noValidate>
                {serverError && (
                    <p className="form-error" role="alert">{serverError}</p>
                )}

                <label className="field">
                    <span className="field__label">Name</span>
                    <span className={`field__control ${errors.name ? "has-error" : ""}`}>
                        <UserRound size={17} aria-hidden="true" />
                        <input
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Your full name"
                            autoComplete="name"
                            autoFocus
                        />
                    </span>
                    {errors.name && <span className="field__error">{errors.name}</span>}
                </label>

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
                            placeholder="At least 6 characters"
                            autoComplete="new-password"
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
                    Create account
                </Button>
            </form>
        </AuthLayout>
    );
}

export default Register;
