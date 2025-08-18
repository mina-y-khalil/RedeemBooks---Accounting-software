import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useModal } from "../../context/Modal";
import {
    thunkCreatePayment,
    thunkUpdatePayment,
    thunkGetPayments,
} from "../../redux/payments";
import { thunkGetVendors } from "../../redux/vendors";
import { thunkGetInvoices } from "../../redux/invoices";
import "./PaymentFormModal.css";

export default function PaymentFormModal({ companyId, payment }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { closeModal } = useModal();
    const ref = useRef(null);

    const vendorsById = useSelector((s) => s.vendors || {});
    const invoicesById = useSelector((s) => s.invoices || {});

    const vendors = useMemo(() => Object.values(vendorsById), [vendorsById]);
    const invoices = useMemo(() => Object.values(invoicesById), [invoicesById]);

    const todayISO = () => {
        const d = new Date();
        const tz = d.getTimezoneOffset();
        const local = new Date(d.getTime() - tz * 60000);
        return local.toISOString().slice(0, 10);
    };

    const [form, setForm] = useState({
        invoice_id: payment?.invoice_id || "",
        vendor_id: payment?.vendor_id || "",
        payment_date: payment?.payment_date || todayISO(),
        amount: payment?.amount ?? "",
        method: payment?.method || "",
        reference_no: payment?.reference_no || payment?.reference_number || "",
    });

    const initialInvoiceDisplay =
        payment && invoicesById[payment.invoice_id]
            ? `#${invoicesById[payment.invoice_id].invoice_number} (id:${payment.invoice_id})`
            : "";
    const initialVendorDisplay =
        payment && vendorsById[payment.vendor_id]
            ? `${vendorsById[payment.vendor_id].name} (#${payment.vendor_id})`
            : "";

    const [invoiceDisplay, setInvoiceDisplay] = useState(initialInvoiceDisplay);
    const [vendorDisplay, setVendorDisplay] = useState(initialVendorDisplay);

    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        dispatch(thunkGetVendors(Number(companyId)));
        dispatch(thunkGetInvoices(Number(companyId)));
    }, [dispatch, companyId]);

    useEffect(() => {
        const onDown = (e) => {
            if (ref.current && !ref.current.contains(e.target)) closeModal();
        };
        document.addEventListener("mousedown", onDown);
        return () => document.removeEventListener("mousedown", onDown);
    }, [closeModal]);

    const onChange = (e) =>
        setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

    const pickAmount = (inv) =>
        inv?.balance_due ??
        inv?.amount_due ??
        inv?.amount ??
        inv?.total ??
        inv?.total_amount ??
        "";

    const onVendorTyped = (e) => {
        const val = e.target.value;
        setVendorDisplay(val);
        const match = vendors.find((v) => `${v.name} (#${v.id})` === val);
        setForm((p) => ({ ...p, vendor_id: match ? match.id : "" }));
    };

    const onInvoiceTyped = (e) => {
        const val = e.target.value;
        setInvoiceDisplay(val);
        const match = invoices.find(
            (inv) => `#${inv.invoice_number} (id:${inv.id})` === val
        );
        if (match) {
            const vendorId = match.vendor_id || "";
            const amountVal = pickAmount(match);
            setForm((p) => ({
                ...p,
                invoice_id: match.id,
                vendor_id: vendorId,
                amount: amountVal !== "" ? String(amountVal) : p.amount,
            }));
            if (vendorId && vendorsById[vendorId]) {
                setVendorDisplay(`${vendorsById[vendorId].name} (#${vendorId})`);
            }
        } else {
            setForm((p) => ({ ...p, invoice_id: "" }));
        }
    };

    const normalizeDate = (d) => {
        if (!d) return "";
        const dt = new Date(d);
        if (Number.isNaN(dt.getTime())) return "";
        return dt.toISOString().slice(0, 10);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        if (!form.vendor_id) return setErrors({ vendor_id: "Vendor is required." });
        if (!form.invoice_id) return setErrors({ invoice_id: "Invoice is required." });
        if (form.amount === "" || Number(form.amount) <= 0)
            return setErrors({ amount: "Valid amount is required." });

        const dateStr = normalizeDate(form.payment_date) || todayISO();

        const payload = {
            invoice_id: Number(form.invoice_id),
            vendor_id: Number(form.vendor_id),
            payment_date: dateStr,
            amount: Number(form.amount),
            method: form.method || "",
            reference_no: form.reference_no || "",
        };

        setSaving(true);
        let res;
        if (payment) {
            res = await dispatch(thunkUpdatePayment(payment.id, payload));
        } else {
            res = await dispatch(thunkCreatePayment(Number(companyId), payload));
        }
        setSaving(false);

        if (res?.errors) {
            setErrors(res.errors);
            return;
        }

        await Promise.all([
            dispatch(thunkGetPayments(Number(companyId))),
            dispatch(thunkGetVendors(Number(companyId))),
            dispatch(thunkGetInvoices(Number(companyId))),
        ]);

        closeModal();
        navigate("/payments");
    };

    return (
        <div className="payment-form-overlay">
            <form ref={ref} onSubmit={handleSubmit} className="payment-form">
                <h2>Payment Details</h2>

                {errors.server && <p className="error top-error">{errors.server}</p>}

                <label>
                    Invoice Number
                    <input
                        list="invoices-list"
                        placeholder="Search invoice..."
                        value={invoiceDisplay}
                        onChange={onInvoiceTyped}
                    />
                    <datalist id="invoices-list">
                        {invoices.map((inv) => (
                            <option
                                key={inv.id}
                                value={`#${inv.invoice_number} (id:${inv.id})`}
                            />
                        ))}
                    </datalist>
                    {errors.invoice_id && <p className="error">{errors.invoice_id}</p>}
                </label>

                <label>
                    Vendor Name
                    <input
                        list="vendors-list"
                        placeholder="Search vendor..."
                        value={vendorDisplay}
                        onChange={onVendorTyped}
                    />
                    <datalist id="vendors-list">
                        {vendors.map((v) => (
                            <option key={v.id} value={`${v.name} (#${v.id})`} />
                        ))}
                    </datalist>
                    {errors.vendor_id && <p className="error">{errors.vendor_id}</p>}
                </label>

                <label>
                    Payment Date
                    <input
                        type="date"
                        name="payment_date"
                        value={form.payment_date}
                        onChange={onChange}
                    />
                    {errors.payment_date && <p className="error">{errors.payment_date}</p>}
                </label>

                <label>
                    Amount
                    <input
                        type="number"
                        name="amount"
                        step="0.01"
                        value={form.amount}
                        onChange={onChange}
                        placeholder="$xx,xxx.xx"
                    />
                    {errors.amount && <p className="error">{errors.amount}</p>}
                </label>

                <label>
                    Method
                    <input
                        name="method"
                        value={form.method}
                        onChange={onChange}
                        placeholder="ACH, Check, Wire..."
                    />
                </label>

                <label>
                    Reference No.
                    <input
                        name="reference_no"
                        value={form.reference_no}
                        onChange={onChange}
                        placeholder="Optional"
                    />
                </label>

                <button className="btn-save" type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save"}
                </button>
            </form>
        </div>
    );
}
