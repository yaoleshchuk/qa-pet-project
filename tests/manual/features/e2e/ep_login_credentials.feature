@EP @Regression
# Technique: Equivalence Partitioning (EP)
# Reference: ISTQB FL 4.1 – Equivalence Partitioning
#
# Partitions for email field:
#   ┌────────────────────────────────────────────────────────────┐
#   │  Partition              │ Class    │ Examples              │
#   ├────────────────────────────────────────────────────────────┤
#   │  Registered + valid fmt │ Valid    │ user@booking.com      │
#   │  Unregistered + valid   │ Invalid  │ ghost@nowhere.com     │
#   │  Malformed (no @)       │ Invalid  │ notanemail            │
#   │  Malformed (no domain)  │ Invalid  │ user@                 │
#   │  Empty string           │ Invalid  │ (empty)               │
#   └────────────────────────────────────────────────────────────┘
#
# Partitions for password field (given valid email):
#   ┌────────────────────────────────────────────────────────────┐
#   │  Partition              │ Class    │ Examples              │
#   ├────────────────────────────────────────────────────────────┤
#   │  Correct password       │ Valid    │ validPass123          │
#   │  Wrong password         │ Invalid  │ wrongpassword         │
#   │  Empty string           │ Invalid  │ (empty)               │
#   └────────────────────────────────────────────────────────────┘
Feature: Login – Equivalence Partitioning of Credentials
  As a QA engineer
  I want to verify login behaviour across all equivalence classes of inputs
  So that one representative from each class is tested without exhaustive enumeration

  # ── Valid partition ───────────────────────────────────────────────────────

  @EP-Valid @Acceptance @Smoke
  Scenario: Login with representative of valid credential partition succeeds
    Given I open the Booking.com homepage
    When I click on the "Sign in" button
    And I enter email "testuser@example.com" and click "Continue"
    And I enter password "correct_password" and click "Sign in"
    Then I should be redirected to the user dashboard

  # ── Invalid email partitions ──────────────────────────────────────────────

  @EP-Invalid @Regression
  Scenario Outline: Login with invalid email class shows an error
    Given I open the Booking.com homepage
    When I click on the "Sign in" button
    And I enter email "<email>" and click "Continue"
    Then I should see an error message

    Examples: Invalid email equivalence classes (one representative each)
      | email            | partition                    |
      | ghost@nowhere.com | unregistered but valid format |
      | notanemail        | malformed – no @ symbol       |
      | user@             | malformed – no domain         |

  # ── Invalid password partitions ───────────────────────────────────────────

  @EP-Invalid @Smoke @Regression
  Scenario Outline: Login with invalid password class shows an error
    Given I open the Booking.com homepage
    When I click on the "Sign in" button
    And I enter email "testuser@example.com" and click "Continue"
    And I enter password "<password>" and click "Sign in"
    Then I should see an error message

    Examples: Invalid password equivalence classes
      | password      | partition             |
      | wrongpassword | incorrect password    |
      | 123           | too short (< 8 chars) |

  # ── Empty field partitions ────────────────────────────────────────────────

  @EP-Invalid @Regression
  Scenario: Submitting login with no credentials triggers form validation
    Given I am on the contact page
    When I click the submit button without filling any field
    Then I should see validation errors for required fields
