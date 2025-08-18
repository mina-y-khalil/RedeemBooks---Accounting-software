import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import { useModal } from "../../context/Modal";
import { thunkGetInvoices, thunkDeleteInvoice } from "../../redux/invoices";
import { thunkGetVendors } from "../../redux/vendors";
import { thunkGetPayments } from "../../redux/payments";
import InvoiceFormModal from "../InvoiceFormModal";
import ConfirmModal from "../ConfirmModal/ConfirmModal";
import "./InvoiceDetailsPage.css";

function StatusPill({ status }) {
    let cls = "pill--pending";
    if (status === "Approved" || status === "Paid") cls = "pill--paid";
    if (status === "Declined" || status === "Denied") cls = "pill--declined";
    return <span className={`status-pill ${cls}`}>{status || "Pending approval"}</span>;
}

function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + (Number(days) || 0));
    return d;
}

function formatISODate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function parsePaymentTerms(raw) {
    if (raw === 0 || raw === "0") return 0;
    if (raw === null || raw === undefined || raw === "") return 0;
    const num = parseInt(String(raw).match(/-?\d+/)?.[0], 10);
    return Number.isNaN(num) ? 0 : num;
}

export default function InvoiceDetailsPage() {
    const { invoiceId } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { setModalContent } = useModal();

    const { companyId: ctxCompanyId } = useOutletContext() || {};
    const companyId = Number(ctxCompanyId || 1);

    const invoice = useSelector((state) => state.invoices?.[Number(invoiceId)]);
    const vendor = useSelector((state) =>
        invoice ? state.vendors?.[invoice.vendor_id] : null
    );
    const payments = useSelector((state) => state.payments || {});
    const paid = Object.values(payments).reduce(
        (sum, p) => (p.invoice_id === Number(invoiceId) ? sum + Number(p.amount || 0) : sum),
        0
    );

    useEffect(() => {
        dispatch(thunkGetInvoices(companyId));
        dispatch(thunkGetVendors(companyId));
        dispatch(thunkGetPayments(companyId));
    }, [dispatch, companyId]);

    if (!invoice) {
        return null;
    }

    let effectiveDueDate = "-";
    if (invoice.invoice_date) {
        const terms = parsePaymentTerms(vendor?.payment_terms);
        const base = new Date(invoice.invoice_date);
        if (!isNaN(base)) {
            const due = addDays(base, terms);
            effectiveDueDate = formatISODate(due);
        }
    } else if (invoice.due_date) {
        effectiveDueDate = invoice.due_date;
    }

    const handleDelete = () => {
        setModalContent(
            <ConfirmModal
                onConfirm={async () => {
                    await dispatch(thunkDeleteInvoice(invoice.id));
                    navigate("/invoices");
                }}
            />
        );
    };

    const handleEdit = () => {
        setModalContent(<InvoiceFormModal companyId={companyId} invoice={invoice} />);
    };

    const handleAddNew = () => {
        setModalContent(<InvoiceFormModal companyId={companyId} />);
    };

    let amountDisplay = "-";
    if (invoice.amount !== undefined && invoice.amount !== null) {
        try {
            amountDisplay = Number(invoice.amount).toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
            });
        } catch {
            amountDisplay = String(invoice.amount);
        }
    }

    const computedStatus =
        invoice.status === "Paid" || paid >= Number(invoice.amount || 0)
            ? "Paid"
            : invoice.status || "Pending approval";

    return (
        <div className="invoice-details">
            <div className="details-header">
                <h2>Invoice Details</h2>
                <div className="header-actions">
                    <button className="btn btn-danger" onClick={handleDelete}>
                        Delete Invoice
                    </button>
                    <button className="btn btn-primary" onClick={handleEdit}>
                        Edit Invoice
                    </button>
                    <button className="btn btn-primary" onClick={handleAddNew}>
                        Add New Invoice
                    </button>
                </div>
            </div>

            <div className="details-grid card">
                <div className="label">Invoice number</div>
                <div className="value">{invoice.invoice_number || "-"}</div>

                <div className="label">Vendor</div>
                <div className="value">{vendor?.name || "-"}</div>

                <div className="label">Invoice Date</div>
                <div className="value">{invoice.invoice_date || "-"}</div>

                <div className="label">Due Date</div>
                <div className="value">{effectiveDueDate || "-"}</div>

                <div className="label">Voucher Date</div>
                <div className="value">{invoice.voucher_date || "-"}</div>

                <div className="label">Status</div>
                <div className="value">
                    <StatusPill status={computedStatus} />
                </div>

                <div className="label">View invoice</div>
                <div className="value">
                    {invoice.invoice_url ? (
                        <a href={invoice.invoice_url} target="_blank" rel="noreferrer">
                            Click here
                        </a>
                    ) : (
                        "-"
                    )}
                </div>

                <div className="label">Amount</div>
                <div className="value">{amountDisplay}</div>

                <div className="label">Description</div>
                <div className="value">{invoice.description || "-"}</div>
            </div>
        </div>
    );
}
