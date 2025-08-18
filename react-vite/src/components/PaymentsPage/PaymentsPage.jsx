import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useModal } from "../../context/Modal";

import { thunkGetPayments, thunkDeletePayment } from "../../redux/payments";
import { thunkGetVendors } from "../../redux/vendors";
import { thunkGetInvoices } from "../../redux/invoices";

import PaymentFormModal from "../PaymentFormModal";
import ConfirmModal from "../ConfirmModal/ConfirmModal";

import "./PaymentsPage.css";

export default function PaymentsPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { setModalContent } = useModal();

    const { companyId: ctxCompanyId } = useOutletContext() || {};
    const companyId = Number(ctxCompanyId ?? 1);

    const payments = Object.values(useSelector((s) => s.payments || {}));
    const vendorsById = useSelector((s) => s.vendors || {});

    useEffect(() => {
        dispatch(thunkGetPayments(companyId));
        dispatch(thunkGetVendors(companyId));
        dispatch(thunkGetInvoices(companyId));
    }, [dispatch, companyId]);

    const openCreate = () =>
        setModalContent(<PaymentFormModal companyId={companyId} />);

    const openEdit = (payment) =>
        setModalContent(<PaymentFormModal companyId={companyId} payment={payment} />);

    const openDelete = (id) =>
        setModalContent(
            <ConfirmModal
                onConfirm={async () => {
                    await dispatch(thunkDeletePayment(id));
                    await Promise.all([
                        dispatch(thunkGetPayments(companyId)),
                        dispatch(thunkGetVendors(companyId)),
                    ]);
                }}
            />
        );

    return (
        <div className="payments-page">
            <div className="payments-header">
                <h2>Payments</h2>
                <button className="btn btn-primary" onClick={openCreate}>
                    Add New Payment
                </button>
            </div>

            <div className="payments-table card">
                <div className="payments-thead">
                    <div>Payment Date</div>
                    <div>Vendor Name</div>
                    <div>Amount</div>
                    <div className="actions-col" />
                </div>

                <div className="payments-tbody">
                    {payments.map((p) => (
                        <div key={p.id} className="payments-row">
                            <div>
                                {p.payment_date
                                    ? new Date(p.payment_date).toLocaleDateString()
                                    : "-"}
                            </div>
                            <div>{vendorsById[p.vendor_id]?.name || "-"}</div>
                            <div>
                                {p.amount != null
                                    ? Number(p.amount).toLocaleString("en-US", {
                                        style: "currency",
                                        currency: "USD",
                                    })
                                    : "-"}
                            </div>

                            <div className="row-actions">
                                <button
                                    className="btn btn-dark"
                                    onClick={() => navigate(`/payments/${p.id}`)}
                                >
                                    View
                                </button>
                                <button className="btn btn-primary" onClick={() => openEdit(p)}>
                                    Edit
                                </button>
                                <button
                                    className="btn btn-danger"
                                    onClick={() => openDelete(p.id)}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}

                    {payments.length === 0 && (
                        <div className="payments-empty">No payments yet.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
