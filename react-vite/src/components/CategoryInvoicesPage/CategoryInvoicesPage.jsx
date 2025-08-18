import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { thunkGetInvoices } from "../../redux/invoices";
import { thunkGetVendors } from "../../redux/vendors";
import { thunkGetPayments } from "../../redux/payments";
import "./CategoryInvoicesPage.css";

function StatusPill({ status }) {
    const map = {
        "Pending approval": "pill--pending",
        Approved: "pill--approved",
        Declined: "pill--declined",
        Denied: "pill--declined",
        Reject: "pill--declined",
        Paid: "pill--paid",
    };
    const cls = map[status] || "pill--pending";
    return <span className={`status-pill ${cls}`}>{status}</span>;
}

export default function CategoryInvoicesPage() {
    const { categoryId } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { companyId: ctxCompanyId } = useOutletContext() || {};
    const companyId = Number(ctxCompanyId ?? 1);

    const categories = useSelector((s) => s.categories || {});
    const category = categories?.[Number(categoryId)] || null;

    const allInvoices = useSelector((s) => s.invoices || {});
    const invoices = useMemo(
        () =>
            Object.values(allInvoices).filter(
                (inv) => Number(inv.category_id) === Number(categoryId)
            ),
        [allInvoices, categoryId]
    );

    const vendorsById = useSelector((s) => s.vendors || {});
    const payments = useSelector((s) => Object.values(s.payments || {}));

    useEffect(() => {
        dispatch(thunkGetInvoices(companyId));
        dispatch(thunkGetVendors(companyId));
        dispatch(thunkGetPayments(companyId));
    }, [dispatch, companyId]);

    const paidByInvoice = useMemo(() => {
        return payments.reduce((acc, p) => {
            acc[p.invoice_id] = (acc[p.invoice_id] || 0) + Number(p.amount || 0);
            return acc;
        }, {});
    }, [payments]);

    return (
        <div className="category-invoices-page">
            <div className="invoices-header">
                <h2>
                    {category
                        ? `Invoices linked to [${category.name}]`
                        : "Invoices linked to this category"}
                </h2>
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
                        const paid = paidByInvoice[inv.id] || 0;
                        const amountNum = Number(inv.amount || 0);
                        const isPaid = amountNum > 0 && paid >= amountNum;
                        const baseStatus =
                            inv.status && inv.status !== "Paid"
                                ? inv.status
                                : "Pending approval";
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
                                </div>
                            </div>
                        );
                    })}

                    {invoices.length === 0 && (
                        <div className="invoices-empty">No invoices in this category yet.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
