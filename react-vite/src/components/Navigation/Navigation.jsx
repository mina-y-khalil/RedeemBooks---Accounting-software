import { useState } from "react";
import { useSelector } from "react-redux";
import { NavLink } from "react-router-dom";
import ProfileButton from "./ProfileButton";
import OpenModalButton from "../OpenModalButton";
import LoginFormModal from "../LoginFormModal";
import SignupFormModal from "../SignupFormModal";
import "./Navigation.css";

const comingSoonFeatures = [
  { name: "Payment Batches", path: "/" },
  { name: "Approvers", path: "/" },
  { name: "Companies", path: "/" },
  { name: "Bank Balances", path: "/" },
  { name: "Audit Logs", path: "/" },
];

function Navigation() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const sessionUser = useSelector((state) => state.session.user);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="sidebar">
      <div className="sidebar-top-section">
        <NavLink to="/" className="sidebar-logo-link">
          <img
            src="https://redeem-innovations.com/wp-content/uploads/2025/08/RedeemBooks-Logo.png"
            alt="Home"
            className="sidebar-logo"
          />
        </NavLink>
        <div className="sidebar-icons">
          <ProfileButton />
        </div>
      </div>

      <div className="sidebar-nav">
        {sessionUser ? (
          <>
            <NavLink to="/" className="nav-button active">
              Dashboard
            </NavLink>

            <button
              onClick={toggleDropdown}
              className="nav-button dark dropdown-toggle"
            >
              Accounts Payable (AP){" "}
              <span
                className={`dropdown-arrow ${isDropdownOpen ? "open" : ""}`}
              >
                &#9660;
              </span>
            </button>

            {isDropdownOpen && (
              <div className="dropdown-container">
                <NavLink to="/vendors" className="nav-button yellow">
                  Vendors
                </NavLink>
                <NavLink to="/categories" className="nav-button yellow">
                  Categories
                </NavLink>
                <NavLink to="/invoices" className="nav-button yellow">
                  Invoices
                </NavLink>
                <NavLink to="/payments" className="nav-button yellow">
                  Payments
                </NavLink>
              </div>
            )}
          </>
        ) : (
          <>
            <OpenModalButton
              buttonText="Sign in to access the application"
              modalComponent={<LoginFormModal />}
              className="nav-button dark"
            />
            <OpenModalButton
              buttonText="Not a user? Sign up now"
              modalComponent={<SignupFormModal />}
              className="nav-button yellow"
            />
          </>
        )}
      </div>

      {sessionUser && (
        <div className="sidebar-nav coming-soon-container">
          {isDropdownOpen &&
            comingSoonFeatures.map((feature) => (
              <NavLink
                to={feature.path}
                key={feature.name}
                className="nav-button deactivated-button"
              >
                {feature.name}{" "}
                <span className="coming-soon-note">Coming Soon</span>
              </NavLink>
            ))}
        </div>
      )}

      {!isDropdownOpen && (
        <div className="sidebar-bottom-section">
          <img
            src="https://redeem-innovations.com/wp-content/uploads/2025/08/Github-qrcode.png"
            alt="QR Code"
            className="qr-code"
          />
          <p className="developer-credit">Developed by: Mina Y. Khalil</p>
        </div>
      )}
    </div>
  );
}

export default Navigation;
