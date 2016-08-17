$(document).ready(function() {
	var date = new Date().valueOf();

	if($('#hsmChart').length) {
		$.ajax({
			url: '/users/'+$('#hsmChart').attr("data-user")+'/workouts/hsm/0/' + date.toString(),
			dataType: 'json',
			type: 'get'
		}).done(function (data) {

			var i, health, magicka, stamina, label, tempDate;
			var health = [];
			var magicka = [];
			var stamina = [];
			var time = [];
			var workouts = data.data.workouts
			var monthNames = ["January", "February", "March", "April", "May", "June",
					"July", "August", "September", "October", "November", "December"
					];

			//- var mySubArray = _.uniq(workouts, 'workoutDate');

			var workoutsNoDuplicate = _.filter(workouts, function (element, index) {
			// tests if the element has a duplicate in the rest of the array
			for(index += 1; index < workouts.length; index += 1) {
				if (_.isEqual(element, workouts[index])) {
						return false;
					}
				}
				return true;
			});

			workoutsNoDuplicate.sort(function(a, b) {
				return parseFloat(a.workoutDate) - parseFloat(b.workoutDate);
			});
			console.log(JSON.stringify(workoutsNoDuplicate));

			for(i=0; i< workoutsNoDuplicate.length;i++){
				health.push(workoutsNoDuplicate[i]['health']);
				magicka.push(workoutsNoDuplicate[i]['magicka']);
				stamina.push(workoutsNoDuplicate[i]['stamina']);
				tempDate = new Date(workoutsNoDuplicate[i]['workoutDate']*1000);
				time.push(tempDate.getDate()+" "+ monthNames[tempDate.getMonth()] + " " + tempDate.getFullYear());
			}

			var ctx = document.getElementById("hsmChart").getContext("2d");

			var data = {
					labels: time,
					datasets: [
							{
									label: "Health",
									fillColor: "rgba(220,220,220,0.2)",
									strokeColor: "rgba(220,220,220,1)",
									pointColor: "rgba(220,220,220,1)",
									pointStrokeColor: "#fff",
									pointHighlightFill: "#fff",
									pointHighlightStroke: "rgba(220,220,220,1)",
									data: health
							},
							{
									label: "Stamina",
									fillColor: "rgba(151,187,205,0.2)",
									strokeColor: "rgba(151,187,205,1)",
									pointColor: "rgba(151,187,205,1)",
									pointStrokeColor: "#fff",
									pointHighlightFill: "#fff",
									pointHighlightStroke: "rgba(151,187,205,1)",
									data: stamina
							},
							{
									label: "Magicka",
									fillColor: "rgba(151,1,205,0.2)",
									strokeColor: "rgba(151,1,205,1)",
									pointColor: "rgba(151,1,205,1)",
									pointStrokeColor: "#fff",
									pointHighlightFill: "#fff",
									pointHighlightStroke: "rgba(151,1,205,1)",
									data: magicka
							}
					]
			};

			new Chart(ctx).Line(data, {
					onAnimationComplete: function () {
						var sourceCanvas = this.chart.ctx.canvas;
						var copyWidth = this.scale.xScalePaddingLeft - 5;
						// the +5 is so that the bottommost y axis label is not clipped off
						// we could factor this in using measureText if we wanted to be generic
						var copyHeight = this.scale.endPoint + 5;
						var targetCtx = document.getElementById("hsmChartAxis").getContext("2d");
						targetCtx.canvas.width = copyWidth;
						targetCtx.drawImage(sourceCanvas, 0, 0, copyWidth, copyHeight, 0, 0, copyWidth, copyHeight);
						var maxScrollLeft = $('#hsmChart').width();
						$('.chartAreaWrapper').animate({scrollLeft: maxScrollLeft}, 1200);

					}

				});
			});
		}
});
