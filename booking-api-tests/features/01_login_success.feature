@API @Acceptance
# Priority: High
Feature: Login API - Success

  Scenario Outline: Login with valid credentials returns token
    When I send POST request to /api/login with email "<email>" and password "<password>"
    Then the response status code should be 200
    And the response should contain field "token"

    Examples:
      | email               | password     |
      | user1@mail.com      | password123  |
      | tester@booking.com  | secretpass   |
