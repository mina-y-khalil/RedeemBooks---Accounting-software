import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useModal } from "../../context/Modal";
import { thunkCreateVendor, thunkUpdateVendor } from "../../redux/vendors";
import "./VendorFormModal.css";

const fields = [
    { key: "name", label: "Vendor Name", required: true },
    { key: "contact_name", label: "Contact Name" },
    { key: "email", label: "Email", type: "email" },
    { key: "phone", label: "Phone" },
    { key: "tax_id", label: "Tax ID" },
    { key: "street", label: "Address" },
    { key: "payment_terms", label: "Payment Terms (days)", type: "number", min: 0, step: 1, placeholder: "e.g., 0 for Due on Receipt" },
    { key: "w9_document_url", label: "W-9 Document URL", type: "url", placeholder: "https://..." },
];

function VendorFormModal({ companyId, vendor }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { closeModal } = useModal();
    const ref = useRef(null);

    const [form, setForm] = useState(() => {
        const init = {};
        fields.forEach((f) => {
            if (f.key === "payment_terms") {
                init[f.key] =
                    vendor && vendor[f.key] !== undefined && vendor[f.key] !== null
                        ? vendor[f.key]
                        : 0;
            } else {
                init[f.key] = vendor ? vendor[f.key] ?? "" : "";
            }
        });
        return init;
    });

    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const onDown = (e) => {
            if (ref.current && !ref.current.contains(e.target)) closeModal();
        };
        document.addEventListener("mousedown", onDown);
        return () => document.removeEventListener("mousedown", onDown);
    }, [closeModal]);

    const onChange = (k, v) => setForm((s) => ({ ...s, [k]: v }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        if (!form.name.trim()) {
            setErrors({ name: "Vendor name is required." });
            return;
        }

        const rawTerms = form.payment_terms;
        const parsedTerms =
            rawTerms === "" || rawTerms === null || rawTerms === undefined
                ? 0
                : Number(rawTerms);

        if (!Number.isInteger(parsedTerms) || parsedTerms < 0) {
            setErrors({ payment_terms: "Payment terms must be a non-negative whole number of days." });
            return;
        }

        const payload = { ...form, payment_terms: parsedTerms };

        setSubmitting(true);
        const result = vendor
            ? await dispatch(thunkUpdateVendor(vendor.id, payload))
            : await dispatch(thunkCreateVendor(companyId, payload));
        setSubmitting(false);

        if (result?.errors) {
            setErrors(result.errors);
            return;
        }

        closeModal();
        navigate("/vendors");
    };

    return (
        <div className="vendor-form-overlay">
            <form ref={ref} onSubmit={handleSubmit} className="vendor-form">
                <h2>Vendor Details</h2>

                {errors.auth && <p className="error top-error">{errors.auth}</p>}
                {errors.server && <p className="error top-error">{errors.server}</p>}

                {fields.map((f) => (
                    <label key={f.key}>
                        {f.label}
                        <input
                            type={f.type || "text"}
                            value={form[f.key]}
                            onChange={(e) => onChange(f.key, e.target.value)}
                            required={!!f.required}
                            placeholder={f.placeholder}
                            min={f.min}
                            step={f.step}
                            inputMode={f.type === "number" ? "numeric" : undefined}
                        />
                        {errors[f.key] && <p className="error">{errors[f.key]}</p>}
                    </label>
                ))}

                <button type="submit" className="btn-save" disabled={submitting}>
                    {submitting ? "Saving..." : "Save"}
                </button>
            </form>
        </div>
    );
}

export default VendorFormModal;