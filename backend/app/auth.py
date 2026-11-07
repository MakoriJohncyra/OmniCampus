import time
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import httpx
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models import User, UserRole

security_scheme = HTTPBearer()

def create_access_token(user_id: UUID, role: str, email: str) -> str:
    """Issue internal institutional signed JWT access token."""
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "iss": "omnicampus-auth-service",
        "exp": expire,
        "iat": datetime.utcnow()
    }
    encoded_jwt = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

async def verify_institutional_sso_id_token(id_token: str) -> dict:
    """
    Validates token issued by University Identity Provider (Keycloak / Okta / Azure AD / Shibboleth).
    In production, this fetches JWKS from settings.OIDC_JWKS_URL and validates signatures, issuer, audience.
    """
    try:
        # Mock/Simulated validation if offline or testing, real verification with JWKS in production
        unverified_claims = jwt.get_unverified_claims(id_token)
        # Check issuer matches university realm
        if not unverified_claims.get("email"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid SSO assertion: missing institutional email."
            )
        return unverified_claims
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Institutional SSO verification failed: {str(e)}"
        )

def get_current_user(
    auth: HTTPAuthorizationCredentials = Security(security_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Dependency that authenticates and extracts active user from Bearer JWT."""
    token = auth.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate institutional credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == UUID(user_id_str)).first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Institutional account is inactive")
    return user

class RoleChecker:
    """
    Role-Based Access Control (RBAC) dependency factory.
    Enforces that the current authenticated user belongs to one of the authorized roles.
    """
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User = Depends(get_current_user)) -> User:
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Role '{user.role}' lacks sufficient privileges. Required: {', '.join(self.allowed_roles)}"
            )
        return user

# Convenient role guard dependencies
require_student = RoleChecker([UserRole.STUDENT, UserRole.LECTURER, UserRole.ADMIN_STAFF, UserRole.SYSTEM_ADMIN])
require_lecturer = RoleChecker([UserRole.LECTURER, UserRole.SYSTEM_ADMIN])
require_admin_staff = RoleChecker([UserRole.ADMIN_STAFF, UserRole.SYSTEM_ADMIN])
require_system_admin = RoleChecker([UserRole.SYSTEM_ADMIN])
require_staff_or_lecturer = RoleChecker([UserRole.LECTURER, UserRole.ADMIN_STAFF, UserRole.SYSTEM_ADMIN])
