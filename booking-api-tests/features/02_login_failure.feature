@API @Smoke
# Priority: Medium
Feature: Login API - Failure

  Scenario Outline: Login with invalid credentials fails
    When I send POST request to /api/login with email "<email>" and password "<password>"
    Then the response status code should be 401
    And the response should contain field "error"

    Examples:
      | email              | password   |
      | fake@mail.com      | wrong123   |
      | test@wrong.com     | invalid    |
