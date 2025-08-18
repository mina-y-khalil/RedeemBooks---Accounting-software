import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useModal } from "../../context/Modal";
import {
    thunkCreateInvoice,
    thunkUpdateInvoice,
    thunkGetInvoices,
} from "../../redux/invoices";
import { thunkGetVendors } from "../../redux/vendors";
import { thunkGetCategories } from "../../redux/categories";
import "./InvoiceFormModal.css";

const STATUS_OPTIONS = ["Pending approval", "Approved", "Declined"];

export default function InvoiceFormModal({ companyId, invoice }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { closeModal } = useModal();
    const boxRef = useRef(null);

    const vendorsById = useSelector((s) => s.vendors || {});
    const categoriesById = useSelector((s) => s.categories || {});
    const invoicesById = useSelector((s) => s.invoices || {});
    const vendors = Object.values(vendorsById);
    const categories = Object.values(categoriesById);

    const [invoiceNumber, setInvoiceNumber] = useState(invoice?.invoice_number || "");
    const [vendorId, setVendorId] = useState(invoice?.vendor_id || "");
    const [categoryId, setCategoryId] = useState(invoice?.category_id || "");
    const [amount, setAmount] = useState(invoice?.amount === 0 ? 0 : invoice?.amount ?? "");
    const [invoiceDate, setInvoiceDate] = useState(invoice?.invoice_date || "");
    const [voucherDate, setVoucherDate] = useState(invoice?.voucher_date || "");
    const [status, setStatus] = useState(invoice?.status || "Pending approval");
    const [invoiceUrl, setInvoiceUrl] = useState(invoice?.invoice_url || "");
    const [description, setDescription] = useState(invoice?.description || "");

    const [vendorText, setVendorText] = useState(
        invoice && vendorsById[invoice.vendor_id]
            ? `${vendorsById[invoice.vendor_id].name} (#${invoice.vendor_id})`
            : ""
    );
    const [categoryText, setCategoryText] = useState(
        invoice && categoriesById[invoice.category_id]
            ? `${categoriesById[invoice.category_id].name} (#${invoice.category_id})`
            : ""
    );

    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (companyId) {
            dispatch(thunkGetVendors(Number(companyId)));
            dispatch(thunkGetCategories(Number(companyId)));
            dispatch(thunkGetInvoices(Number(companyId)));
        }
    }, [dispatch, companyId]);

    useEffect(() => {
        function handleMouseDown(e) {
            if (boxRef.current && !boxRef.current.contains(e.target)) closeModal();
        }
        document.addEventListener("mousedown", handleMouseDown);
        return () => document.removeEventListener("mousedown", handleMouseDown);
    }, [closeModal]);

    function handleVendorTextChange(e) {
        const val = e.target.value;
        setVendorText(val);
        const match = vendors.find((v) => `${v.name} (#${v.id})` === val);
        setVendorId(match ? match.id : "");
    }

    function handleCategoryTextChange(e) {
        const val = e.target.value;
        setCategoryText(val);
        const match = categories.find((c) => `${c.name} (#${c.id})` === val);
        setCategoryId(match ? match.id : "");
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setErrors({});

        const num = invoiceNumber.trim();
        if (!num) return setErrors({ invoice_number: "Invoice number is required." });
        if (!vendorId) return setErrors({ vendor_id: "Vendor is required." });
        if (!categoryId) return setErrors({ category_id: "Category is required." });

        const duplicate = Object.values(invoicesById).some(
            (i) =>
                String(i.invoice_number).trim().toLowerCase() === num.toLowerCase() &&
                (!invoice || i.id !== invoice.id)
        );
        if (duplicate) {
            setErrors({ invoice_number: "Invoice number already exists." });
            return;
        }

        const v = vendorsById[Number(vendorId)];
        const terms = v?.payment_terms ?? 0;
        const base = invoiceDate ? new Date(invoiceDate) : new Date();
        const due = new Date(base);
        const days = Number(
            typeof terms === "number"
                ? terms
                : parseInt(String(terms).match(/-?\d+/)?.[0] || "0", 10)
        );
        if (!Number.isNaN(days)) due.setDate(base.getDate() + days);
        const due_date = due.toISOString().split("T")[0];

        setSubmitting(true);
        const payload = {
            invoice_number: num,
            vendor_id: Number(vendorId),
            category_id: Number(categoryId),
            amount: amount === "" ? null : Number(amount),
            invoice_date: invoiceDate || null,
            voucher_date: voucherDate || null,
            due_date,
            status,
            invoice_url: invoiceUrl || null,
            description: description || "",
        };

        try {
            let resp;
            if (invoice) {
                resp = await dispatch(thunkUpdateInvoice(invoice.id, payload));
            } else {
                resp = await dispatch(thunkCreateInvoice(Number(companyId), payload));
            }
            setSubmitting(false);

            if (resp?.errors) {
                setErrors(resp.errors);
                return;
            }

            await dispatch(thunkGetInvoices(Number(companyId)));
            await dispatch(thunkGetVendors(Number(companyId)));
            closeModal();
            navigate("/invoices");
        } catch (err) {
            setSubmitting(false);
            setErrors({ server: "Failed to save invoice." });
        }
    }

    return (
        <div className="invoice-form-overlay">
            <form ref={boxRef} className="invoice-form" onSubmit={handleSubmit}>
                <h2>Invoice Details</h2>

                {errors.auth && <p className="error top-error">{errors.auth}</p>}
                {errors.server && <p className="error top-error">{errors.server}</p>}

                <label>
                    Invoice Number
                    <input
                        name="invoice_number"
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        required
                    />
                    {errors.invoice_number && <p className="error">{errors.invoice_number}</p>}
                </label>

                <label>
                    Vendor Name
                    <input
                        list="vendors-list"
                        placeholder="Start typing vendor..."
                        value={vendorText}
                        onChange={handleVendorTextChange}
                    />
                </label>
                <datalist id="vendors-list">
                    {vendors.map((v) => (
                        <option key={v.id} value={`${v.name} (#${v.id})`} />
                    ))}
                </datalist>
                {errors.vendor_id && <p className="error">{errors.vendor_id}</p>}

                <label>
                    Category
                    <input
                        list="categories-list"
                        placeholder="Start typing category..."
                        value={categoryText}
                        onChange={handleCategoryTextChange}
                    />
                </label>
                <datalist id="categories-list">
                    {categories.map((c) => (
                        <option key={c.id} value={`${c.name} (#${c.id})`} />
                    ))}
                </datalist>
                {errors.category_id && <p className="error">{errors.category_id}</p>}

                <label>
                    Invoice Date
                    <input
                        type="date"
                        name="invoice_date"
                        value={invoiceDate}
                        onChange={(e) => setInvoiceDate(e.target.value)}
                    />
                </label>

                <label>
                    Voucher Date
                    <input
                        type="date"
                        name="voucher_date"
                        value={voucherDate}
                        onChange={(e) => setVoucherDate(e.target.value)}
                    />
                </label>

                <label>
                    Status
                    <select
                        name="status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                    >
                        {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    Invoice URL
                    <input
                        name="invoice_url"
                        value={invoiceUrl}
                        onChange={(e) => setInvoiceUrl(e.target.value)}
                    />
                </label>

                <label>
                    Amount
                    <input
                        name="amount"
                        type="number"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                </label>

                <label>
                    Description
                    <input
                        name="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </label>

                <button type="submit" className="btn-save" disabled={submitting}>
                    {submitting ? "Saving..." : "Save"}
                </button>
            </form>
        </div>
    );
}
