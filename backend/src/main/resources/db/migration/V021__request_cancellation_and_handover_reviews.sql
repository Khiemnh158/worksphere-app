CREATE TABLE request_cancellation_reviews (
 request_id UUID PRIMARY KEY REFERENCES service_requests(id),
 state VARCHAR(20) NOT NULL CHECK(state IN ('PENDING','APPROVED','REJECTED','SUPERSEDED')),
 reason TEXT NOT NULL,requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 decided_by UUID REFERENCES users(id),decision_note TEXT,decided_at TIMESTAMPTZ
);
CREATE TABLE request_handover_reviews (
 assignment_id UUID PRIMARY KEY REFERENCES service_assignments(id),
 previous_user_id UUID NOT NULL REFERENCES users(id),
 review_note TEXT,reviewed_at TIMESTAMPTZ
);
