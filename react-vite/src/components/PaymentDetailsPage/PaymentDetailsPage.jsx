import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import { useModal } from "../../context/Modal";

import { thunkGetPayments, thunkDeletePayment } from "../../redux/payments";
import { thunkGetVendors } from "../../redux/vendors";
import { thunkGetInvoices } from "../../redux/invoices";

import PaymentFormModal from "../PaymentFormModal";
import ConfirmModal from "../ConfirmModal/ConfirmModal";

import "./PaymentDetailsPage.css";

export default function PaymentDetailsPage() {
    const { paymentId } = useParams();
    const id = Number(paymentId);

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { setModalContent } = useModal();

    const { companyId: ctxCompanyId } = useOutletContext() || {};
    const companyId = Number(ctxCompanyId ?? 1);

    const payment = useSelector((s) => s.payments?.[id]);
    const vendorsById = useSelector((s) => s.vendors || {});
    const invoicesById = useSelector((s) => s.invoices || {});

    useEffect(() => {
        dispatch(thunkGetPayments(companyId));
        dispatch(thunkGetVendors(companyId));
        dispatch(thunkGetInvoices(companyId));
    }, [dispatch, companyId]);

    const openEdit = () =>
        setModalContent(<PaymentFormModal companyId={companyId} payment={payment} />);

    const openCreate = () =>
        setModalContent(<PaymentFormModal companyId={companyId} />);

    const openDelete = () =>
        setModalContent(
            <ConfirmModal
                onConfirm={async () => {
                    await dispatch(thunkDeletePayment(id));
                    await dispatch(thunkGetPayments(companyId));
                    navigate("/payments");
                }}
            />
        );

    if (!payment) return null;

    const vendor = vendorsById[payment.vendor_id];
    const invoice = invoicesById[payment.invoice_id];

    return (
        <div className="payment-details">
            <div className="details-header">
                <h2>Payments</h2>
                <div className="header-actions">
                    <button className="btn btn-danger" onClick={openDelete}>
                        Delete Payment
                    </button>
                    <button className="btn btn-primary" onClick={openEdit}>
                        Edit Payment
                    </button>
                    <button className="btn btn-primary" onClick={openCreate}>
                        Add New Payment
                    </button>
                </div>
            </div>

            <div className="details-grid">
                <div className="label">Invoice Number</div>
                <div className="value">{invoice ? invoice.invoice_number : "-"}</div>

                <div className="label">Vendor Name</div>
                <div className="value">{vendor ? vendor.name : "-"}</div>

                <div className="label">Payment Date</div>
                <div className="value">
                    {payment.payment_date
                        ? new Date(payment.payment_date).toLocaleDateString()
                        : "-"}
                </div>

                <div className="label">Amount</div>
                <div className="value">
                    {payment.amount != null
                        ? Number(payment.amount).toLocaleString("en-US", {
                            style: "currency",
                            currency: "USD",
                        })
                        : "-"}
                </div>

                <div className="label">Method</div>
                <div className="value">{payment.method || "-"}</div>

                <div className="label">Reference No.</div>
                <div className="value">
                    {payment.reference_no || payment.reference_number || "-"}
                </div>

                <div className="label">Vendor Balance</div>
                <div className="value">
                    {vendor?.balance != null
                        ? Number(vendor.balance).toLocaleString("en-US", {
                            style: "currency",
                            currency: "USD",
                        })
                        : "$0.00"}
                </div>
            </div>
        </div>
    );
}
