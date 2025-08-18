import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useModal } from "../../context/Modal";
import { thunkGetInvoices, thunkDeleteInvoice } from "../../redux/invoices";
import { thunkGetVendors } from "../../redux/vendors";
import { thunkGetPayments } from "../../redux/payments";
import InvoiceFormModal from "../InvoiceFormModal";
import ConfirmModal from "../ConfirmModal/ConfirmModal";
import "./InvoicesPage.css";

function StatusPill({ status }) {
    const map = {
        "Pending approval": "pill--pending",
        Approved: "pill--approved",
        Paid: "pill--paid",
        Declined: "pill--declined",
        Denied: "pill--declined",
        Reject: "pill--declined",
    };
    const cls = map[status] || "pill--pending";
    return <span className={`status-pill ${cls}`}>{status}</span>;
}

export default function InvoicesPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { setModalContent } = useModal();

    const { companyId: ctxCompanyId } = useOutletContext() || {};
    const companyId = Number(ctxCompanyId ?? 1);

    const invoicesById = useSelector((s) => s.invoices || {});
    const invoices = useMemo(() => Object.values(invoicesById), [invoicesById]);
    const vendorsById = useSelector((s) => s.vendors || {});

    const paymentsById = useSelector((s) => s.payments || {});

    useEffect(() => {
        dispatch(thunkGetInvoices(companyId));
        dispatch(thunkGetVendors(companyId));
        dispatch(thunkGetPayments(companyId));
    }, [dispatch, companyId]);

    const paidByInvoice = useMemo(() => {
        const map = {};
        for (const p of Object.values(paymentsById)) {
            const key = Number(p.invoice_id);
            map[key] = (map[key] || 0) + Number(p.amount || 0);
        }
        return map;
    }, [paymentsById]);

    const openCreate = () =>
        setModalContent(<InvoiceFormModal companyId={companyId} />);

    const openEdit = (invoice) =>
        setModalContent(<InvoiceFormModal companyId={companyId} invoice={invoice} />);

    const openDelete = (id) =>
        setModalContent(
            <ConfirmModal
                onConfirm={async () => {
                    await dispatch(thunkDeleteInvoice(id));
                    await Promise.all([
                        dispatch(thunkGetInvoices(companyId)),
                        dispatch(thunkGetPayments(companyId)),
                    ]);
                }}
            />
        );

    return (
        <div className="invoices-page">
            <div className="invoices-header">
                <h2>Invoices</h2>
                <button className="btn btn-primary" onClick={openCreate}>
                    Add New Invoice
                </button>
            </div>

            <div className="invoices-table card">
                <div className="invoices-thead">
                    <div>Invoice number</div>
                    <div>Vendor</div>
                    <div>Amount</div>
                    <div>Status</div>
                    <div className="actions-col" />
                </div>

                <div className="invoices-tbody">
                    {invoices.map((inv) => {
                        const paid = paidByInvoice[Number(inv.id)] || 0;
                        const amountNum = Number(inv.amount || 0);
                        const isPaid = amountNum > 0 && paid >= amountNum;

                        const baseStatus =
                            inv.status && inv.status !== "Paid" ? inv.status : "Pending approval";

                        const status = isPaid ? "Paid" : baseStatus;

                        return (
                            <div key={inv.id} className="invoices-row">
                                <div>{inv.invoice_number}</div>
                                <div>{vendorsById[inv.vendor_id]?.name || "-"}</div>
                                <div>
                                    {inv.amount != null
                                        ? Number(inv.amount).toLocaleString("en-US", {
                                            style: "currency",
                                            currency: "USD",
                                        })
                                        : "-"}
                                </div>
                                <div>
                                    <StatusPill status={status} />
                                </div>
                                <div className="row-actions">
                                    <button
                                        className="btn btn-dark"
                                        onClick={() => navigate(`/invoices/${inv.id}`)}
                                    >
                                        View
                                    </button>
                                    <button className="btn btn-primary" onClick={() => openEdit(inv)}>
                                        Edit
                                    </button>
                                    <button className="btn btn-danger" onClick={() => openDelete(inv.id)}>
                                        Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    {invoices.length === 0 && (
                        <div className="invoices-empty">No invoices yet.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
