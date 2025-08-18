import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useModal } from "../../context/Modal";
import { thunkGetVendors, thunkDeleteVendor } from "../../redux/vendors";
import { thunkGetInvoices } from "../../redux/invoices";
import { thunkGetPayments } from "../../redux/payments";
import VendorFormModal from "../VendorFormModal/VendorFormModal";
import ConfirmModal from "../ConfirmModal/ConfirmModal";
import "./VendorsPage.css";

function VendorsPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { setModalContent } = useModal();
    const { companyId } = useOutletContext();

    const vendorsById = useSelector((s) => s.vendors || {});
    const vendors = useMemo(() => Object.values(vendorsById), [vendorsById]);

    const invoicesById = useSelector((s) => s.invoices || {});
    const invoices = useMemo(() => Object.values(invoicesById), [invoicesById]);

    const payments = useSelector((s) => s.payments || {});
    const paymentsArr = useMemo(() => Object.values(payments), [payments]);

    useEffect(() => {
        if (companyId) {
            dispatch(thunkGetVendors(Number(companyId)));
            dispatch(thunkGetInvoices(Number(companyId)));
            dispatch(thunkGetPayments(Number(companyId)));
        }
    }, [dispatch, companyId]);

    const balancesByVendor = useMemo(() => {
        const totals = {};
        for (const inv of invoices) {
            if (!inv?.vendor_id) continue;
            const include =
                inv.status === "Pending approval" ||
                inv.status === "Approved" ||
                inv.status === "Paid" ||
                !inv.status;
            if (!include) continue;
            totals[inv.vendor_id] = (totals[inv.vendor_id] || 0) + Number(inv.amount || 0);
        }
        for (const p of paymentsArr) {
            if (!p?.vendor_id) continue;
            totals[p.vendor_id] = (totals[p.vendor_id] || 0) - Number(p.amount || 0);
        }
        return totals;
    }, [invoices, paymentsArr]);

    const openCreate = () => setModalContent(<VendorFormModal companyId={companyId} />);
    const openEdit = (vendor) =>
        setModalContent(<VendorFormModal companyId={companyId} vendor={vendor} />);
    const openDelete = (vendorId) =>
        setModalContent(
            <ConfirmModal
                message="Are you sure you want to proceed?"
                onConfirm={async () => {
                    await dispatch(thunkDeleteVendor(vendorId));
                    await dispatch(thunkGetVendors(Number(companyId)));
                }}
            />
        );

    return (
        <div className="vendors-page">
            <div className="vendors-header">
                <h2>Vendors</h2>
                <button className="btn btn-primary" onClick={openCreate}>
                    Add New Vendor
                </button>
            </div>

            <div className="vendors-table card">
                <div className="vendors-thead">
                    <div>Vendor Name</div>
                    <div>email</div>
                    <div>Balance</div>
                    <div className="actions-col" />
                </div>

                <div className="vendors-tbody">
                    {vendors.map((v) => {
                        const bal = balancesByVendor[v.id];
                        return (
                            <div className="vendors-row" key={v.id}>
                                <div>{v.name}</div>
                                <div>{v.email || "-"}</div>
                                <div>
                                    {bal != null
                                        ? Number(bal).toLocaleString("en-US", {
                                            style: "currency",
                                            currency: "USD",
                                        })
                                        : "-"}
                                </div>
                                <div className="row-actions">
                                    <button
                                        className="btn btn-view"
                                        onClick={() => navigate(`/vendors/${v.id}`)}
                                    >
                                        View
                                    </button>
                                    <button className="btn btn-edit" onClick={() => openEdit(v)}>
                                        Edit
                                    </button>
                                    <button
                                        className="btn btn-danger"
                                        onClick={() => openDelete(v.id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    {vendors.length === 0 && (
                        <div className="vendors-empty">No vendors yet.</div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default VendorsPage;
