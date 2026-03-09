@Regression @Smoke
# Priority: High
Feature: Invalid Login Handling

  Scenario Outline: User fails to log in with invalid credentials
    Given I open the Booking.com homepage
    When I click on the "Sign in" button
    And I enter email "<email>" and click "Continue"
    And I enter password "<password>" and click "Sign in"
    Then I should see an error message

    Examples:
      | email              | password      |
      | wrong@mail.com     | badpass123    |
      | fakeuser@test.com  | 123456        |
